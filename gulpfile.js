/**
 * gulpfile.js
 */

"use strict";

const gulp = require("gulp");
const bom = require("gulp-bom");
const less = require('gulp-less');
const hash = require("gulp-static-hash");
const cssmin = require("gulp-clean-css");
const uglify = require("gulp-uglify");
const htmlmin = require("gulp-htmlmin");
const imagemin = require('gulp-imagemin');
const livereload = require('gulp-livereload');
const autoprefixer = require('gulp-autoprefixer');
const server = require('gulp-server-livereload');

const fs = require("fs");
const replace = require("gulp-replace");

// 静态文件打包合并
const del = require("del");

// 线上打包
const tar = require("gulp-tar");
const gzip = require("gulp-gzip");

// 生产环境先拷贝目录
gulp.task("copy", function(cb) {
    del(["./build"]).then(function() {
        gulp.src(["./view/*", "./img/**", "./js/*", "./style/*"], {
                base: './'
            })
            .pipe(gulp.dest("./build"))
            .on("end", cb);
    });
});

// js合并与压缩
gulp.task("js", ["copy"], function(cb) {
    gulp.src("./build/js/*")
        .pipe(uglify())
        .pipe(bom())
        .pipe(gulp.dest("./build/js/"))
        .on("end", cb);
});
// js合并与压缩
gulp.task("minjs", function(cb) {
    gulp.src("./build/js/*")
        .pipe(uglify())
        .pipe(bom())
        .pipe(gulp.dest("./build/js/"))
        .on("end", cb);
});

// less编译
gulp.task("less", ["js"], function(cb) {
    gulp.src('./less/**.less')
        .pipe(less())
        .pipe(gulp.dest('style/'))
        .on("end", cb);
});

// css合并与压缩
gulp.task("style", ["less"], function(cb) {
    gulp.src("./build/style/*")
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(cssmin({compatibility: 'ie8'}))
        .pipe(bom())
        .pipe(gulp.dest("./build/style/"))
        .on("end", cb);
});

// html添加hash后缀
gulp.task("hash", ["style"], function(cb) {
    gulp.src("./build/view/*.html")
        .pipe(
            replace("../", `./`)
        )
        .pipe(hash({
            asset: "./"
        }))
        .pipe(bom())
        .pipe(gulp.dest("./build/view"))
        .on("end", cb);
});

// 压缩图片
gulp.task('img', ['hash'], function(cb) {
    gulp.src('img/**/*.{png,jpg,gif,ico}')
        .pipe(imagemin({
            optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
            progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
            interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
            multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
        }))
        .pipe(gulp.dest('build/img'))
        .on("end", cb);;
});

// 压缩html页面
gulp.task("minify", ["img"], function(cb) {
    gulp.src("./build/view/*.html")
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest('./build'))
        .on("end", cb);
    // 删除没有压缩的 html 文件
    del(["./build/view"]);
});

//编译less
gulp.task('less_dev', function() {
    gulp.src('./less/**.less')
        .pipe(less())
        .pipe(gulp.dest('style/'));
});

//监听所有打包之后的文件变动，自动刷新页面
gulp.task('watch', function() {
    // Create LiveReload server
    livereload.listen({
        port: 9000
    });
    // Watch any files in dist/, reload on change
    //监听less文件
    try {
        gulp.watch('./less/**', ['less_dev'])
        gulp.watch(['style/**']).on('change', livereload.changed);
        gulp.watch(['views/**']).on('change', livereload.changed);
        gulp.watch(['js/**']).on('change', livereload.changed);
    } catch (e) {
        console.log(e);
        gulp.task('watch');
    }
});

gulp.task('watch', function() {
    //监听less文件
    gulp.watch('./less/**.less', ['less_dev'])
});

gulp.task('webserver', ['watch'], function() {
    gulp.src('./')
        .pipe(server({
            host: '0.0.0.0',
            livereload: {
                enable: true,
                filter: function(filename, cb) {
                    cb(!/\.(sa|le)ss$|node_modules/.test(filename));
                }
            },
            directoryListing: true,
            open: true,
            defaultFile: 'index.html'
        }));
});

gulp.task('copy-package.json', function() {
    gulp.src('./package.json')
        .pipe(gulp.dest('build/'));
});

// 生产
gulp.task("default", ["minify"]);

module.exports = gulp;