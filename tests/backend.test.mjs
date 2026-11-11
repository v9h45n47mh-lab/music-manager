import test from 'node:test';
import {execFileSync} from 'node:child_process';
test('Python installation, migration and Apple Music account isolation',()=>{
 execFileSync('python3',['-m','unittest','discover','-s','tests','-p','test_*.py','-v'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
});
