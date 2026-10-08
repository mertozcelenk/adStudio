// run-all öz-testi için sahte test: girdi eksik, çalıştırılamadı
import { finish } from '../../../lib/common.mjs';
finish({ test: 'notrun', status: 'not_run', reason: 'girdi eksik', findings: [] });
