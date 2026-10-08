// run-all öz-testi için sahte test: her zaman geçer
import { finish } from '../../../lib/common.mjs';
finish({ test: 'pass', status: 'passed', findings: [{ rule: 'fake/warn', impact: 'Medium', blocks: false, msg: 'uyarı' }] });
