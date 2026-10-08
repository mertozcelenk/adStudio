// run-all öz-testi için sahte test: teslimi engelleyen bir bulguyla başarısız olur
import { finish } from '../../../lib/common.mjs';
finish({ test: 'fail', status: 'failed', findings: [{ rule: 'fake/block', file: 'screens/a.html', impact: 'High', blocks: true, msg: 'engel' }] });
