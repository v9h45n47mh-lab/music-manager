import test from 'node:test';
import {execFileSync} from 'node:child_process';
test('Python Apple Music account isolation and provider contracts',()=>{
 execFileSync('python3',['-m','unittest','discover','-s','tests','-p','test_apple_music.py','-v'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
});
