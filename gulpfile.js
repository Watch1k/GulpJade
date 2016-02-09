'use strict';

var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    rigger = require('gulp-rigger'),
    spritesmith = require('gulp.spritesmith'),
    jade = require('gulp-jade'),
    browserSync = require("browser-sync"),
    iconfont = require("gulp-iconfont"),
    consolidate = require("gulp-consolidate"),
    rimraf = require('rimraf'),
    htmlhint = require("gulp-htmlhint"),
    cmq = require('gulp-combine-mq'),
    zip = require('gulp-zip'),
    reload = browserSync.reload;

// IE 8 opacity
var opacity = function(css, opts) {
    css.eachDecl(function(decl) {
        if (decl.prop === 'opacity') {
            decl.parent.insertAfter(decl, {
                prop: '-ms-filter',
                value: '"progid:DXImageTransform.Microsoft.Alpha(Opacity=' + (parseFloat(decl.value) * 100) + ')"'
            });
        }
    });
};

// @TODO: move all paths to these variables
var src = {
    root: 'src',
    sass: 'src/sass/',
    js: 'src/js',
    img: 'src/img',
    svg: 'src/img/svg',
    helpers: 'src/helpers'
};

//** dest paths **
var dest = {
    root: 'build',
    html: 'build',
    css: 'build/css',
    js: 'build/js',
    img: 'build/img'
};

//jade
gulp.task('jade', function() {
    return gulp.src(['src/jade/**/*.jade', '!src/jade/includes/**/*.jade'])
        .pipe(jade({
            pretty: true
        }))
        .pipe(gulp.dest('build/'));
});


// sass
gulp.task('sass', function() {
    var processors = [
        opacity,
        autoprefixer({
            browsers: ['last 100 versions'],
            cascade: false
        })
    ];

    return sass('src/sass/*.sass', {
            sourcemap: true,
            style: 'compact'
        })
        .on('error', function(err) {
            console.error('Error', err.message);
        })
        .pipe(postcss(processors))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('build/css/'));
});

// sprite
gulp.task('sprite', function() {
    var spriteData = gulp.src(src.img + '/icons/*.png')
        .pipe(spritesmith({
            imgName: 'icons.png',
            cssName: '_sprite.sass',
            imgPath: '../img/icons.png',
            cssFormat: 'sass',
            padding: 4,
            // algorithm: 'top-down',
            cssTemplate: src.helpers + '/sprite.template.mustache'
        }));
    spriteData.img
        .pipe(gulp.dest(dest.img));
    spriteData.css
        .pipe(gulp.dest(src.sass));
});

// html includes
gulp.task('html', function() {
    gulp.src('src/*.html')
        .pipe(rigger())
        .pipe(htmlhint())
        .pipe(htmlhint.reporter())
        .pipe(gulp.dest('build/'))
        .pipe(reload({
            stream: true
        }));
});

// js includes
gulp.task('js', function() {
    gulp.src('src/js/**/*.js')
        .pipe(rigger())
        .pipe(gulp.dest('build/js/'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('copy', function() {
    gulp.src('src/img/**')
        .pipe(gulp.dest('build/img/'));
    gulp.src('src/fonts/*.*')
        .pipe(gulp.dest('build/css/fonts/'));
    gulp.src('src/css/*.*')
        .pipe(gulp.dest('build/css/lib/'));
    gulp.src('src/video/*.*')
        .pipe(gulp.dest('build/video/'));
});

// delete app
gulp.task('delete', function(cb) {
    rimraf('./build', cb);
});

// icon font
var fontname = 'svgfont';
gulp.task('font', function() {
    return gulp.src('src/img/svg/*.svg')
        // .pipe(svgmin())
        .pipe(iconfont({
            fontName: fontname,
            appendUnicode: true,
            formats: ['ttf', 'eot', 'woff', 'woff2'],
            // timestamp: runTimestamp,
            normalize: true,
            fontHeight: 1001,
            fontStyle: 'normal',
            fontWeight: 'normal'
        }))
        .on('glyphs', function(glyphs, options) {
            console.log(glyphs);
            gulp.src('src/helpers/_svgfont.sass')
                .pipe(consolidate('lodash', {
                    glyphs: glyphs,
                    fontName: fontname,
                    fontPath: 'fonts/',
                    className: 'icon'
                }))
                .pipe(gulp.dest('src/sass/'));
            gulp.src('src/helpers/icons.html')
                .pipe(consolidate('lodash', {
                    glyphs: glyphs,
                    fontName: fontname,
                    fontPath: 'fonts/',
                    className: 'icon',
                    htmlBefore: '<i class="icon ',
                    htmlAfter: '"></i>',
                    htmlBr: ''
                }))
                .pipe(gulp.dest('build/'));
        })
        .pipe(gulp.dest('build/css/fonts/'))
        .pipe(reload({
            stream: true
        }));
});

// make zip-file
gulp.task('zip', function() {
    return gulp.src('build/**/*')
        .pipe(zip('Miply.zip'))
        .pipe(gulp.dest(''));
});

//webserver
gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: dest.root,
            directory: true,
            // index: 'index.html'
        },
        files: [dest.html + '/*.html', dest.css + '/*.css', dest.js + '/*.js'],
        port: 8080,
        notify: false,
        ghostMode: false,
        online: false,
        open: true
    });
});

gulp.task('watch', function() {
    gulp.watch('src/jade/**/*.jade', ['jade']);
    gulp.watch(src.sass + '/**/*', ['sass']);
    gulp.watch('src/js/*', ['js']);
    gulp.watch('src/img/*', ['copy']);
    gulp.watch('src/img/svg/*', ['font']);
    gulp.watch(['src/*.html', 'src/partials/*.html'], ['html']);
    gulp.watch(src.img + '/icons/*.png', ['sprite']);
});


gulp.task('default', ['browser-sync', 'watch'], function() {});
gulp.task('build', ['jade', 'html', 'font', 'sprite', 'copy', 'js', 'sass'], function() {});