import json
import subprocess
import os

# Configuration: update these paths as needed.
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
USER_DATA_DIR = "/Users/(myname)/chrome_automation_profile"  # Use a dedicated profile logged into mole.haynes.com

BASE_URL = "https://mole.haynes.com"  # Base URL to prepend to relative URLs.
OUTPUT_DIR = "pdf_output"

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open("chapters.json", "r", encoding="utf-8") as f:
    chapters = json.load(f)

for chapter in chapters:
    chapter_folder_name = chapter["chapter_title"].replace(" ", "_")
    chapter_dir = os.path.join(OUTPUT_DIR, chapter_folder_name)
    os.makedirs(chapter_dir, exist_ok=True)
    
    print(f"Processing Chapter: {chapter['chapter_title']}")
    
    for page in chapter["pages"]:
        page_num = page["page_num"]
        page_title_clean = page["page_title"].replace(" ", "_")
        full_url = BASE_URL + page["url"]
        outfile = os.path.join(chapter_dir, f"{page_num}_{page_title_clean}.pdf")
        
        print(f"  → Printing page {page_num}: {full_url} to {outfile}")
        
        cmd = [
            CHROME_PATH,
            "--headless",
            "--disable-gpu",
            "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
            "--disable-extensions",
            "--no-sandbox",
            "--disable-background-networking",
            "--disable-background-timer-throttling",
            "--disable-breakpad",
            "--disable-client-side-phishing-detection",
            "--disable-default-apps",
            "--disable-hang-monitor",
            "--disable-popup-blocking",
            "--disable-prompt-on-repost",
            "--disable-sync",
            "--metrics-recording-only",
            "--no-first-run",
            "--safebrowsing-disable-auto-update",
            f"--user-data-dir={USER_DATA_DIR}",
            f"--print-to-pdf={outfile}",
            "--virtual-time-budget=30000",
            full_url
        ]
        
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
        except subprocess.TimeoutExpired:
            print(f"    Timeout expired for page {page_num}. Skipping to next page.")
        except subprocess.CalledProcessError as e:
            print(f"    Error printing page {page_num}: {e}")
        
print("All pages processed.")
