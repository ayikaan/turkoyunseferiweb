import urllib.request
import json
import sys

import os

token = os.environ.get("GITHUB_TOKEN", "")
headers = {
    'User-Agent': 'Mozilla/5.0',
    'Authorization': f'token {token}' if token else '',
    'Accept': 'application/vnd.github.v3+json'
}

class StripAuthRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, hdrs, newurl):
        old_host = urllib.parse.urlparse(req.full_url).hostname
        new_host = urllib.parse.urlparse(newurl).hostname
        
        new_req = urllib.request.Request(newurl, method=req.get_method())
        for key, val in req.headers.items():
            if key.lower() == 'authorization' and old_host != new_host:
                continue
            new_req.add_header(key, val)
        return new_req

def monitor():
    run_id = 27507511634
    try:
        jobs_url = f"https://api.github.com/repos/ayikaan/turkoyunseferiweb/actions/runs/{run_id}/jobs"
        jobs_req = urllib.request.Request(jobs_url, headers=headers)
        job_id = None
        status = None
        conclusion = None
        with urllib.request.urlopen(jobs_req) as response:
            data = json.loads(response.read().decode())
            for job in data.get('jobs', []):
                print(f"Job: {job['name']} | Status: {job['status']} | Conclusion: {job['conclusion']}")
                job_id = job['id']
                status = job['status']
                conclusion = job['conclusion']
        if status == 'completed':
            print(f"Job completed with conclusion: {conclusion}")
            log_url = f"https://api.github.com/repos/ayikaan/turkoyunseferiweb/actions/jobs/{job_id}/logs"
            log_req = urllib.request.Request(log_url, headers=headers)
            opener = urllib.request.build_opener(StripAuthRedirectHandler())
            with opener.open(log_req) as log_response:
                log_data = log_response.read().decode('utf-8', errors='ignore')
                lines = log_data.split('\n')
                print("Last 100 lines of job log:")
                for line in lines[-100:]:
                    safe_line = line.encode('ascii', errors='replace').decode('ascii')
                    print(safe_line)
    except Exception as e:
        print("Error fetching status or logs:", e)

if __name__ == "__main__":
    monitor()
