// run-all öz-testi için sahte test: aldığı --only değerini reason'a yazar
import { finish, argValue } from '../../../lib/common.mjs';
finish({ test: 'args', status: 'passed', reason: `only=${argValue('--only') ?? 'yok'}`, findings: [] });
