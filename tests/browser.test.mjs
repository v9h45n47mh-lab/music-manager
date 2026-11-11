import test from 'node:test';
import {execFileSync} from 'node:child_process';

// GitHub's Ubuntu runner already supplies Chrome. Exercise the UI during the
// normal test step without waiting for optional browser/dependency downloads.
test('music and alarm UI in the CI runner supplied Chrome', {skip:!process.env.CI&&!process.env.MUSIC_TEST_SYSTEM_BROWSER},()=>{
  const executable=process.env.CHROMIUM_PATH||execFileSync('which',['google-chrome'],{encoding:'utf8'}).trim();
  execFileSync(process.execPath,['tests/browser.cjs'],{
    cwd:new URL('..',import.meta.url),env:{...process.env,CHROMIUM_PATH:executable},stdio:'inherit',timeout:300000
  });
});
