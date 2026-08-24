#!/usr/bin/env node
import path from 'node:path'
import fs from 'node:fs/promises'
import { NapiCli } from '@napi-rs/cli'

const root = process.cwd()

const destDir = path.join(root, 'prebuilds', `${process.platform}-${process.arch}`)
await fs.mkdir(destDir, { recursive: true })

const cli = new NapiCli()

const { task, abort } = await cli.build({
  release: true,
  cargoName: 'tree_sitter_highlight',
  outputDir: destDir,
  cwd: root,
})

process.on('SIGINT', () => { abort(); process.exit(1) })

await task;
