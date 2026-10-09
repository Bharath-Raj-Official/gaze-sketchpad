"""Pre-push reminder: credential scope is the remote-write enforcement boundary."""
import os,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
expected="https://github.com/Bharath-Raj-Official/gaze-sketchpad.git"
def git(*args):return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
try:
 if Path(git('rev-parse','--show-toplevel')).resolve()!=root:raise ValueError()
 if git('remote').splitlines()!=['origin']:raise ValueError()
 if any(os.environ.get(k) for k in ['GIT_CONFIG_COUNT','GIT_CONFIG_PARAMETERS','GIT_SSH_COMMAND']):raise ValueError()
 if any(l.lower().startswith(('url.','core.sshcommand=','remote.origin.mirror=')) for l in git('config','--list').splitlines()):raise ValueError()
 for flags in [(),('--push',)]:
  if git('remote','get-url',*flags,'--all','origin').splitlines()!=[expected]:raise ValueError()
 if len(sys.argv)>2 and (sys.argv[1]!='origin' or sys.argv[2]!=expected):raise ValueError()
except Exception:
 print('Push rejected: destination does not match this eligible repository.',file=sys.stderr);sys.exit(1)
