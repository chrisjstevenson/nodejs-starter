var path = require("path");
var gulp = require("gulp");
var gutil = require("gulp-util");
var plumber = require("gulp-plumber");
var del = require("del");
var shell = require("gulp-shell");
var watch = require("gulp-watch");
var batch = require("gulp-batch");
var normalizeYaml = require("./tools/build/normalize-yaml");
var normalize = require("./tools/build/normalize-yaml/extensions");
var yamlToLynx = require("./tools/build/yaml-to-lynx")();
var createStateDocuments = require("./tools/build/create-state-documents");
var generateIndex = require("./tools/build/generate-index");
var filter = require("gulp-filter");
var vinylPaths = require("vinyl-paths");
var urls = require("./tools/build/urls");
var argv = require("yargs").argv;

var files = {
    yaml: {
        watch: ["./src/**/*.yml", "./src/**/*.js"],
        build: ["./src/**/*.yml", "!**/*.data/*", "!./src/urls.yml", "!**/_*.yml"],
        filter: ["**/*.yml", "!**/*.data/*", "!urls.yml", "!**/_*.yml"]
    },
    json: "./src/**/*.json",
    images: ["./src/**/*.svg", "./src/**/*.png", "./src/**/*.jpg", "./src/**/*.pdf"]
};

normalizeYaml.extensions.add(normalize.setSpecName);
normalizeYaml.extensions.add(normalize.normalizeSpecHints);
normalizeYaml.extensions.add(normalize.titleLabelsItsContainer);
normalizeYaml.extensions.add(normalize.inferTitle);
normalizeYaml.extensions.add(normalize.inferLabel);
normalizeYaml.extensions.add(normalize.inferLink);
normalizeYaml.extensions.add(normalize.inferImage);
normalizeYaml.extensions.add(normalize.inferContent);
normalizeYaml.extensions.add(normalize.inferSubmit);
normalizeYaml.extensions.add(normalize.inferSection);
normalizeYaml.extensions.add(normalize.inferInputSection);
normalizeYaml.extensions.add(normalize.inferForm);
normalizeYaml.extensions.add(normalize.inferHeader);
normalizeYaml.extensions.add(normalize.inferContainer);
normalizeYaml.extensions.add(normalize.inferText);
normalizeYaml.extensions.add(normalize.inferTextInput);
normalizeYaml.extensions.add(normalize.inferMediaType);
normalizeYaml.extensions.add(normalize.inferAttributeList);
normalizeYaml.extensions.add(normalize.inferListing);
normalizeYaml.extensions.add(normalize.removeRealmSpec);
normalizeYaml.extensions.add(normalize.removeScopeSpec);
if (!argv.prod) normalizeYaml.extensions.add(normalize.addFollowDelay(1000));

normalizeYaml.extensions.after(normalize.applyRealmToDocument("http://bestbuy.com/retail/like-for-like/"));

gulp.task("default", ["build"]);

gulp.task("clean", function () {
    return del("./out");
});

gulp.task("build", ["clean", "build-yaml", "build-images"]);

gulp.task("watch", function () {
    return gulp.src(files.yaml.watch)
        .pipe(watch(files.yaml.watch, batch(function (events, done) {
            var length = (events._list && events._list.length) || 1;
            gutil.log(gutil.colors.yellow("---------"));
            gutil.log(gutil.colors.yellow(length + " changes detected. Starting 'build' task"));
            gutil.log(gutil.colors.yellow("---------"));
            gulp.start("build");
            done();
        })));
});

gulp.task("build-dynamic", ["clean", "build-yaml-dynamic", "build-images", "build-client"]);

gulp.task("serve", shell.task("node app.js"));

gulp.task("build-yaml", ["clean"], function () {
    return gulp.src(files.yaml.build)
        .pipe(normalizeYaml())
        .pipe(yamlToLynx())
        .pipe(createStateDocuments())
        .pipe(gulp.dest("./out"));
});

gulp.task("build-yaml-dynamic", ["clean"], function () {
    return gulp.src(files.yaml.build)
        .pipe(normalizeYaml())
        .pipe(yamlToLynx())
        .pipe(gulp.dest("./out"));
});

gulp.task("build-images", ["clean"], function () {
    return gulp.src(files.images)
        .pipe(gulp.dest("./out"));
});

gulp.task("build-client", ["clean", "build-fonts"], function () {
    return gulp.src(["./src/client/**/*", "!./src/client/fonts/*"])
        .pipe(gulp.dest("./out/client"));
});

gulp.task("build-fonts", ["clean"], function () {
    return gulp.src(["./src/client/fonts/*"])
        .pipe(gulp.dest("./out/fonts"));
});

gulp.task("build-test-index", function () {
    return gulp.src("out/**/*.lnx")
        .pipe(generateIndex())
        .pipe(gulp.dest("./out"));
});
