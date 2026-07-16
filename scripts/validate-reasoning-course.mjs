#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = {
    html: resolve(root, 'index.html'),
    css: resolve(root, 'reasoning-planning-deep-dive.css'),
    script: resolve(root, 'reasoning-planning-deep-dive.js')
};

for (const [label, file] of Object.entries(files)) {
    if (!existsSync(file)) throw new Error(`Missing ${label}: ${file}`);
}

const html = readFileSync(files.html, 'utf8');
const css = readFileSync(files.css, 'utf8');
const script = readFileSync(files.script, 'utf8');
let failures = 0;

function requireMatch(label, source, pattern) {
    if (pattern.test(source)) {
        console.log(`PASS ${label}`);
    } else {
        failures += 1;
        console.error(`FAIL ${label}`);
    }
}

const requiredSections = [
    'rp-roadmap', 'rp-causality', 'rp-calibration', 'rp-collaboration',
    'rp-memory', 'rp-planning', 'rp-exercise-studio'
];
for (const id of requiredSections) {
    requireMatch(`section ${id}`, html, new RegExp(`id=["']${id}["']`));
}

const requiredLabs = [
    'rpCausalLab', 'rpControllerLab', 'rpAgentLab', 'rpSagaLab',
    'rpPlanBuilder', 'rpProgressBar'
];
for (const id of requiredLabs) {
    requireMatch(`lab ${id}`, html, new RegExp(`id=["']${id}["']`));
}

requireMatch('course chapter switch', html, /data-chapter="reasoning-planning"/);
requireMatch('Stanford course attribution', html, /cs372-syllabus\.html#resources/);
requireMatch('independent tutorial disclaimer', html, /not an official Stanford course page/);
requireMatch('responsive course styling', css, /@media \(max-width: 700px\)/);
requireMatch('causal interaction', script, /function setupCausalLab\(\)/);
requireMatch('transaction interaction', script, /function setupSagaLab\(\)/);
requireMatch('retrieval-practice persistence', script, /machinelearner-rp-progress-v1/);
requireMatch('Manim lesson styling', css, /\.rp-manim-lesson/);

const requiredVisuals = [
    'causal-intervention-flow', 'multi-agent-evidence-flow',
    'saga-compensation-flow', 'temporal-plan-dependencies'
];
for (const slug of requiredVisuals) {
    for (const extension of ['jpg', 'mp4', 'webm']) {
        const path = resolve(root, 'assets', 'manim', `${slug}.${extension}`);
        if (existsSync(path)) console.log(`PASS visual ${slug}.${extension}`);
        else {
            failures += 1;
            console.error(`FAIL visual ${slug}.${extension}`);
        }
    }
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicates.length) {
    failures += duplicates.length;
    console.error(`FAIL duplicate ids: ${duplicates.join(', ')}`);
} else {
    console.log(`PASS ${ids.length} unique document ids`);
}

const quizCount = [...html.matchAll(/class="rp-quiz" data-rp-answer=/g)].length;
if (quizCount === 5) console.log('PASS 5 retrieval-practice checks');
else {
    failures += 1;
    console.error(`FAIL expected 5 retrieval-practice checks, found ${quizCount}`);
}

const localReferences = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map(match => match[1])
    .filter(value => !/^(?:https?:|mailto:|#|data:)/.test(value))
    .map(value => value.split(/[?#]/)[0])
    .filter(Boolean);
const missing = [...new Set(localReferences)].filter(value => !existsSync(resolve(root, value)));
if (missing.length) {
    failures += missing.length;
    console.error(`FAIL missing local references: ${missing.join(', ')}`);
} else {
    console.log(`PASS ${new Set(localReferences).size} local references resolve`);
}

if (failures) process.exit(1);
console.log('Reasoning and planning course validation passed.');
