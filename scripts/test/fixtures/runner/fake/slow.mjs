// run-all öz-testi için sahte test: 1.5 sn bekleyip geçer (aynı anda çalışma denemesi)
import { finish } from '../../../lib/common.mjs';
setTimeout(() => finish({ test: 'slow', status: 'passed', findings: [] }), 1500);
