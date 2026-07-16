#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const source = readFileSync(new URL('../pytorch-course-data.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context, { filename: 'pytorch-course-data.js' });

const data = context.window.PyTorchCourseData;
if (!data?.examples || !data?.architectures) {
    throw new Error('PyTorchCourseData did not expose examples and architectures.');
}

const localPython = new URL('../.venv-manim/bin/python', import.meta.url).pathname;
const python = process.env.PYTORCH_LAB_PYTHON || (existsSync(localPython) ? localPython : 'python3');
let failures = 0;

for (const marker of [
    'id="python-zero-to-hero"',
    'Neural Networks: Zero to Hero playlist',
    '<optgroup label="Real-world project labs">'
]) {
    if (html.includes(marker)) console.log(`PASS course marker ${marker}`);
    else {
        failures += 1;
        console.error(`FAIL course marker ${marker}`);
    }
}

const appliedLabs = ['churn', 'demand', 'fraud', 'diagnostics', 'bpe', 'scaling'];
const requiredBriefFields = ['project', 'dataset', 'skill', 'deliverable', 'watchFor'];
for (const id of appliedLabs) {
    const example = data.examples[id];
    if (!example) {
        failures += 1;
        console.error(`FAIL missing applied lab ${id}`);
        continue;
    }
    const missingFields = requiredBriefFields.filter(field => !example[field]);
    if (missingFields.length || !Array.isArray(example.challenges) || example.challenges.length < 3) {
        failures += 1;
        console.error(`FAIL applied lab brief ${id}: ${missingFields.join(', ') || 'fewer than 3 challenges'}`);
    } else {
        console.log(`PASS applied brief ${id}`);
    }
}

for (const slug of ['activation-gradient-health', 'bpe-token-merge']) {
    for (const extension of ['jpg', 'mp4', 'webm']) {
        const asset = new URL(`../assets/manim/${slug}.${extension}`, import.meta.url).pathname;
        if (existsSync(asset)) console.log(`PASS visual ${slug}.${extension}`);
        else {
            failures += 1;
            console.error(`FAIL visual ${slug}.${extension}`);
        }
    }
}

for (const [id, example] of Object.entries(data.examples)) {
    const result = spawnSync(python, ['-c', example.code], {
        encoding: 'utf8',
        maxBuffer: 4 * 1024 * 1024,
        timeout: 30_000
    });
    if (result.status !== 0) {
        failures += 1;
        console.error(`FAIL ${id}\n${result.stderr || result.error?.message || 'unknown error'}`);
    } else {
        const lines = result.stdout.trim().split('\n');
        console.log(`PASS ${id.padEnd(10)} ${lines.at(-1) || '(no output)'}`);
    }
}

const requiredArchitectures = ['mlp', 'cnn', 'resnet', 'rnn', 'autoencoder', 'unet', 'gnn', 'transformer', 'gpt'];
for (const id of requiredArchitectures) {
    if (!data.architectures[id]?.code) {
        failures += 1;
        console.error(`FAIL architecture ${id}`);
    }
}

console.log(`${Object.keys(data.examples).length} runnable labs; ${Object.keys(data.architectures).length} architecture guides.`);
if (failures) process.exit(1);
