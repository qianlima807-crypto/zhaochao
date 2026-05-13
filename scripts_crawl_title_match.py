#!/usr/bin/env python3
import argparse
import json
import re
import sqlite3
import time
from dataclasses import dataclass
from datetime import datetime
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import List, Optional, Tuple
from urllib.parse import quote_plus, urlencode
from urllib.request import Request, urlopen

CCGP_URL = "http://search.ccgp.gov.cn/bxsearch"
UA = "Mozilla/5.0 (compatible; title-crawler/2.0)"

DATE_RE = re.compile(r"(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})")
SPLIT_RE = re.compile(r"[\-－—|｜:：（）()【】\[\]]")

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
    y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
    try:
        return datetime(y, mo, d).strftime("%Y-%m-%d")
    except ValueError:
        return None


def title_variants(title: str) -> List[str]:
    parts = [p.strip() for p in SPLIT_RE.split(title) if len(p.strip()) >= 6]
    variants = [title]
    if parts:
        variants.append(parts[0])
    if len(parts) > 1:
        variants.append(parts[-1])
    dedup = []
    for v in variants:
        if v and v not in dedup:
            dedup.append(v)
    return dedup


def fetch_ccgp_items(limit: int = 10) -> List[dict]:
    params = {
        "searchtype": "2", "page_index": "1", "start_time": "", "end_time": "",
        "timeType": "2", "searchparam": "", "searchchannel": "0", "dbselect": "bidx",
        "kw": "", "bidSort": "0", "pinMu": "0", "bidType": "0", "buyerName": "",
        "projectId": "", "displayZone": "", "zoneId": "", "agentName": "",
    }
    html = get(f"{CCGP_URL}?{urlencode(params)}")
    p = LinkParser(); p.feed(html)
    items = []
    for href, txt in p.links:
        if len(txt) < 10:
            continue
        if not any(k in txt for k in ["采购", "招标", "中标", "成交", "公告"]):
            continue
        if txt in [i['title'] for i in items]:
            continue
        pub_date = extract_date(txt) or datetime.now().strftime("%Y-%m-%d")
        items.append({"title": txt, "source_url": href, "publish_date": pub_date, "source_site": "ccgp"})
        if len(items) >= limit:
            break
    return items


@dataclass
class MatchCandidate:
    source_title: str
    source_date: str
    query_variant: str
    site: str
    matched: int
    matched_title: str
    matched_url: str
    matched_date: str
    is_same_day: int
    fetched_at: str
    raw_note: str


def query_site(site: str, keyword: str) -> Tuple[str, str]:
    if site == "qianlima":
        url = f"https://search.qianlima.com/?q={quote_plus(keyword)}#/search"
    else:
        url = f"https://www.yfbzb.com/search/invitedBidSearch?defaultSearch=true&keyword={quote_plus(keyword)}"
    html = get(url)
    return url, html


def parse_candidates(html: str) -> List[Tuple[str, str, Optional[str]]]:
    p = LinkParser(); p.feed(html)
    rows = []
    for href, txt in p.links:
        if len(txt) < 8:
            continue
        if not any(k in txt for k in ["采购", "招标", "中标", "成交", "公告"]):
            continue
        d = extract_date(txt)
        rows.append((txt, href, d))
    return rows


def init_db(conn: sqlite3.Connection):
    conn.execute("""
    CREATE TABLE IF NOT EXISTS source_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_title TEXT,
      source_date TEXT,
      source_url TEXT,
      source_site TEXT,
      fetched_at TEXT
    )
    """)
    conn.execute("""
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_title TEXT,
      source_date TEXT,
      query_variant TEXT,
      source_site TEXT,
      site TEXT,
      matched INTEGER,
      matched_title TEXT,
      matched_url TEXT,
      matched_date TEXT,
      is_same_day INTEGER,
      fetched_at TEXT,
      raw_note TEXT
    )
    """)
    conn.commit()


def main():
    parser = argparse.ArgumentParser(description="CCGP title multi-variant search probe -> sqlite")
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--sleep", type=float, default=0.5)
    parser.add_argument("--output", type=str, default="probe.sqlite")
    args = parser.parse_args()

    db_path = Path(args.output)
    conn = sqlite3.connect(db_path)
    init_db(conn)

    items = fetch_ccgp_items(args.limit)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for it in items:
        conn.execute(
            "INSERT INTO source_items(source_title, source_date, source_url, source_site, fetched_at) VALUES (?,?,?,?,?)",
            (it["title"], it["publish_date"], it["source_url"], it.get("source_site", "unknown"), now),
        )

    for idx, it in enumerate(items, 1):
        print(f"[{idx}/{len(items)}] {it['title']}")
        variants = title_variants(it["title"])
        for site in ["qianlima", "yfbzb"]:
            if site == it.get("source_site"):
                continue
            for v in variants:
                fetched_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                try:
                    search_url, html = query_site(site, v)
                    candidates = parse_candidates(html)
                    same_day = [c for c in candidates if c[2] == it["publish_date"]]
                    if same_day:
                        title, href, d = same_day[0]
                        rec = MatchCandidate(it["title"], it["publish_date"], v, site, 1, title, href, d or "", 1, fetched_at, search_url)
                    else:
                        rec = MatchCandidate(it["title"], it["publish_date"], v, site, 0, "", "", "", 0, fetched_at, search_url)
                except Exception as e:
                    rec = MatchCandidate(it["title"], it["publish_date"], v, site, 0, "", "", "", 0, fetched_at, f"error:{e}")

                conn.execute(
                    """INSERT INTO matches(source_title,source_date,query_variant,source_site,site,matched,matched_title,matched_url,matched_date,is_same_day,fetched_at,raw_note)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (rec.source_title, rec.source_date, rec.query_variant, it.get("source_site", "unknown"), rec.site, rec.matched, rec.matched_title, rec.matched_url, rec.matched_date, rec.is_same_day, rec.fetched_at, rec.raw_note),
                )
                conn.commit()
                time.sleep(max(0, args.sleep))

    summary = conn.execute("SELECT site, COUNT(*) total, SUM(matched) matched FROM matches GROUP BY site").fetchall()
    print("\nSummary:")
    print(json.dumps([{"site": s, "total": t, "matched": m or 0} for s, t, m in summary], ensure_ascii=False, indent=2))
    conn.close()
    print(f"Saved to sqlite: {db_path.resolve()}")


if __name__ == "__main__":
    main()
