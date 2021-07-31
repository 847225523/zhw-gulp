#!/usr/bin/env node
// 通过process.argv拿到传递的参数
// console.log(process.argv)
process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(require.resolve('../lib/index.js'))
 
require('gulp/bin/gulp')