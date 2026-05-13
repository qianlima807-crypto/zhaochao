#!/usr/bin/env python3
import argparse
import json
import re
import sqlite3
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import List, Optional, Tuple
from urllib.parse import quote_plus
from urllib.request import Request, urlopen

UA = "Mozilla/5.0 (compatible; duplicate-rate-probe/1.0)"
DATE_RE = re.compile(r"(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})")
SPLIT_RE = re.compile(r"[\-－—|｜:：（）()【】\[\]]")

SITES = {
    "qianlima": "https://search.qianlima.com/?q={kw}#/search",
    "yfbzb": "https://www.yfbzb.com/search/invitedBidSearch?defaultSearch=true&keyword={kw}",
}

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_a = False
        self.href = ""
        self.buf: List[str] = []
        self.links: List[Tuple[str, str]] = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            self.in_a = True
            self.buf = []
            self.href = dict(attrs).get("href", "")

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self.in_a:
            txt = unescape("".join(self.buf)).strip()
            self.links.append((self.href, re.sub(r"\s+", " ", txt)))
            self.in_a = False

    def handle_data(self, data):
        if self.in_a:
            self.buf.append(data)


def get(url: str, timeout: int = 15) -> str:
    req = Request(url, headers={"User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9"})
    with urlopen(req, timeout=timeout) as resp:
        body = resp.read()
        ct = resp.headers.get("Content-Type", "")
    enc = "utf-8"
    m = re.search(r"charset=([\w-]+)", ct, re.I)
    if m:
        enc = m.group(1)
    for e in [enc, "utf-8", "gb18030", "gbk"]:
        try:
            return body.decode(e)
        except Exception:
            continue
    return body.decode("utf-8", errors="ignore")


def extract_date(s: str) -> Optional[str]:
    m = DATE_RE.search(s)
    if not m:
        return None
    try:
        return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3))).strftime("%Y-%m-%d")
    except ValueError:
        return None


def normalize_title(title: str) -> str:
    t = title.strip()
    t = re.sub(r"\s+", "", t)
    t = re.sub(r"[【】\[\]（）()《》<>]", "", t)
    t = re.sub(r"(招标公告|采购公告|中标公告|成交公告)$", "", t)
    t = re.sub(r"(项目编号|招标编号|采购编号)[:：]?\s*[A-Za-z0-9\-_/]+", "", t)
    return t.lower()


def query_site(site: str, keyword: str) -> str:
    url = SITES[site].format(kw=quote_plus(keyword))
    return get(url)


def parse_search_rows(html: str) -> List[Tuple[str, str, Optional[str]]]:
    p = LinkParser(); p.feed(html)
    rows = []
    for href, txt in p.links:
        if len(txt) < 8:
            continue
        if not any(k in txt for k in ["采购", "招标", "中标", "成交", "公告"]):
            continue
        rows.append((txt, href, extract_date(txt)))
    return rows


def pick_seed_titles(site: str, hours_ago: int, count: int) -> List[Tuple[str, str]]:
    html = query_site(site, "招标公告")
    rows = parse_search_rows(html)
    cutoff = (datetime.now() - timedelta(hours=hours_ago)).date()
    out: List[Tuple[str, str]] = []
    seen = set()
    for title, href, d in rows:
        if not d or title in seen:
            continue
        if datetime.strptime(d, "%Y-%m-%d").date() <= cutoff:
            out.append((title, d))
            seen.add(title)
        if len(out) >= count:
            break
    return out


def title_variants(title: str) -> List[str]:
    parts = [p.strip() for p in SPLIT_RE.split(title) if len(p.strip()) >= 6]
    vals = [title]
    if parts:
        vals.append(parts[0])
    if len(parts) > 1:
        vals.append(parts[-1])
    out = []
    for v in vals:
        if v and v not in out:
            out.append(v)
    return out


def init_db(conn: sqlite3.Connection):
    conn.execute("""CREATE TABLE IF NOT EXISTS duplicate_seed (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site TEXT,
      seed_title TEXT,
      seed_date TEXT,
      normalized_seed TEXT,
      fetched_at TEXT
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS duplicate_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site TEXT,
      seed_title TEXT,
      query_variant TEXT,
      result_title TEXT,
      result_url TEXT,
      result_date TEXT,
      normalized_result TEXT,
      is_duplicate INTEGER,
      fetched_at TEXT
    )""")
    conn.commit()


def main():
    ap = argparse.ArgumentParser(description="Targeted duplicate-rate probe with sqlite")
    ap.add_argument("--sites", default="qianlima,yfbzb")
    ap.add_argument("--hours-ago", type=int, default=48)
    ap.add_argument("--sleep", type=float, default=0.2)
    ap.add_argument("--output", default="duplicate_probe.sqlite")
    ap.add_argument("--seed-count", type=int, default=10)
    args = ap.parse_args()

    sites = [s.strip() for s in args.sites.split(",") if s.strip() in SITES]
    conn = sqlite3.connect(Path(args.output))
    init_db(conn)

    summary = []
    for site in sites:
        print(f"\n== Site: {site} ==")
        seeds = pick_seed_titles(site, args.hours_ago, args.seed_count)
        if not seeds:
            print("No seed title found.")
            summary.append({"site": site, "status": "no_seed"})
            continue

        site_total_rows = 0
        site_duplicate_rows = 0

        for seed_title, seed_date in seeds:
            norm_seed = normalize_title(seed_title)
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            conn.execute("INSERT INTO duplicate_seed(site,seed_title,seed_date,normalized_seed,fetched_at) VALUES (?,?,?,?,?)",
                        (site, seed_title, seed_date, norm_seed, now))

            total_rows = 0
            duplicate_rows = 0
            for variant in title_variants(seed_title):
                try:
                    html = query_site(site, variant)
                    rows = parse_search_rows(html)
                except Exception as e:
                    print(f"query failed for variant={variant[:20]}: {e}")
                    continue

                for title, href, d in rows:
                    norm = normalize_title(title)
                    is_dup = 1 if norm and (norm == norm_seed or norm_seed in norm or norm in norm_seed) else 0
                    total_rows += 1
                    duplicate_rows += is_dup
                    conn.execute("""INSERT INTO duplicate_rows(site,seed_title,query_variant,result_title,result_url,result_date,normalized_result,is_duplicate,fetched_at)
                                    VALUES (?,?,?,?,?,?,?,?,?)""",
                                (site, seed_title, variant, title, href, d or "", norm, is_dup, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
                conn.commit()
                time.sleep(max(0, args.sleep))

            site_total_rows += total_rows
            site_duplicate_rows += duplicate_rows

        rate = round((site_duplicate_rows / site_total_rows) * 100, 2) if site_total_rows else 0.0
        print(f"seeds={len(seeds)}")
        print(f"rows={site_total_rows}, duplicate_rows={site_duplicate_rows}, duplicate_rate={rate}%")
        summary.append({"site": site, "seed_count": len(seeds), "total_rows": site_total_rows, "duplicate_rows": site_duplicate_rows, "duplicate_rate": rate})

    print("\nSummary:")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    conn.close()


if __name__ == "__main__":
    main()
