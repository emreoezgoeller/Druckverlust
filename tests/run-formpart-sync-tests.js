#!/usr/bin/env node

import { formatFormPartSyncReport, runFormPartSyncValidation } from '../src/testing/FormPartSyncRunner.js';

const report = runFormPartSyncValidation();
console.log(formatFormPartSyncReport(report));

if (report.status !== 'ok') process.exitCode = 1;
