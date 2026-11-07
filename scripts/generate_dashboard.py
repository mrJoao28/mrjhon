#!/usr/bin/env python3
"""Generate a self-contained SVG using GitHub's contribution data (last 12 months)."""
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen
from datetime import datetime, timezone
from html import escape

USER = "mrJoao28"
QUERY = """query($login:String!) {
 user(login:$login) {
  contributionsCollection {
   totalCommitContributions
   totalPullRequestContributions
   totalIssueContributions
   contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } }
  }
 }
}"""

def main():
    token = os.environ["GITHUB_TOKEN"]
    req = Request("https://api.github.com/graphql",
                  data=json.dumps({"query": QUERY, "variables": {"login": USER}}).encode(),
                  headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                           "User-Agent": "github-profile-dashboard"})
    with urlopen(req, timeout=25) as response:
        payload = json.load(response)
    if payload.get("errors") or not payload.get("data", {}).get("user"):
        raise RuntimeError(f"GitHub GraphQL request failed: {payload.get('errors')}")
    collection = payload["data"]["user"]["contributionsCollection"]
    calendar = collection["contributionCalendar"]
    commits = collection["totalCommitContributions"]
    prs = collection["totalPullRequestContributions"]
    issues = collection["totalIssueContributions"]
    total = calendar["totalContributions"]
    days = [day for week in calendar["weeks"] for day in week["contributionDays"]]
    days = days[-91:]
    values = [d["contributionCount"] for d in days]
    palette = ["#15283b", "#075985", "#0284c7", "#06b6d4", "#67e8f9"]
    squares = []
    for i, count in enumerate(values):
        x = 36 + (i // 7) * 19
        y = 177 + (i % 7) * 16
        shade = 0 if count == 0 else min(4, 1 + (count >= 2) + (count >= 5) + (count >= 10))
        squares.append(f'<rect x="{x}" y="{y}" width="13" height="11" rx="3" fill="{palette[shade]}"><title>{escape(days[i]["date"])}: {count} contributions</title></rect>')
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    cards = [("COMMITS", commits, 36), ("PULL REQUESTS", prs, 254), ("ISSUES", issues, 472), ("CONTRIBUTIONS", total, 690)]
    items = []
    for label, val, x in cards:
        items.append(f'<rect x="{x}" y="80" width="195" height="77" rx="12" fill="#101e30" stroke="#1e3a52"/>'
                     f'<text x="{x+15}" y="103" fill="#94a3b8" font-size="12">{label}</text>'
                     f'<text x="{x+15}" y="139" fill="#e0f2fe" font-size="29" font-weight="bold">{val:,}</text>')
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="920" height="340" viewBox="0 0 920 340" role="img" aria-labelledby="title desc">
<title id="title">GitHub contributions for {USER}</title><desc id="desc">Last 12 months: {commits} commits, {prs} pull requests, {issues} issues and {total} contributions. Recent daily activity shown below.</desc>
<rect width="920" height="340" rx="18" fill="#0d1117"/>
<rect x="1" y="1" width="918" height="338" rx="17" fill="none" stroke="#164e63"/>
<text x="36" y="43" font-family="Arial,sans-serif" font-size="23" font-weight="bold" fill="#e2e8f0">GitHub activity</text>
<text x="36" y="62" font-family="Arial,sans-serif" font-size="12" fill="#94a3b8">Verified public contributions · rolling 12 months</text>
<circle cx="867" cy="37" r="6" fill="#22d3ee"><animate attributeName="opacity" values="1;.35;1" dur="2.4s" repeatCount="indefinite"/></circle>
<g font-family="Arial,sans-serif">{''.join(items)}
<text x="36" y="194" font-size="13" fill="#94a3b8">RECENT ACTIVITY · 13 WEEKS</text>
</g>
<g transform="translate(0,24)">{''.join(squares)}</g>
<text x="36" y="324" font-family="Arial,sans-serif" font-size="11" fill="#64748b">Updated {now} · Data: GitHub GraphQL API · Commit count may exclude some private/non-default branch commits</text>
</svg>"""
    Path("assets").mkdir(exist_ok=True)
    Path("assets/github-activity.svg").write_text(svg, encoding="utf-8")

if __name__ == "__main__":
    main()
