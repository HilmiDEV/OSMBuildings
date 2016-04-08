
var fs = require('fs');

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      glx: {
        options: {
          separator: "\n",
          banner: "(function(global) {",
          footer: "}(this));",
          sourceMap: true
        },
        src: [
          "src/glx/index.js",
          "src/glx/prefix.js",
          "src/glx/util.js",
          "src/glx/Buffer.js",
          "src/glx/Framebuffer.js",
          "src/glx/Shader.js",
          "src/glx/Matrix.js",
          "src/glx/Texture.js",
          "src/glx/texture/index.js",
          "src/glx/texture/Image.js",
          "src/glx/texture/Data.js",
          "src/glx/mesh/index.js",
          "src/glx/mesh/Triangle.js",
          "src/glx/mesh/Plane.js",
          "src/glx/mesh/Cube.js",
          "src/glx/suffix.js"
        ],
        dest: 'lib/GLX.debug.js'
      },

      'osmb-basemap': {
        options: {
          separator: "\n",
          banner: "(function(global) {",
          footer: "}(this));",
          sourceMap: true
        },
        src: [
          'src/engines/Basemap/index.js',
          'src/engines/Basemap/Pointer.js',
          'src/engines/Basemap/Layers.js',
          grunt.file.readJSON('config.json').lib,
          grunt.file.readJSON('config.json').src
        ],
        dest: 'dist/OSMBuildings/<%=pkg.name%>.debug.js'
      }
    },

    copy: {
      'assets': {
        src: 'src/skydome.jpg',
        dest: 'dist/OSMBuildings/skydome.jpg'
      },
      'css': {
        src: 'src/engines/Basemap/style.css',
        dest: 'dist/OSMBuildings/<%=pkg.name%>.css'
      }
    },

    uglify: {
      'osmb-basemap': {
        options: {
          sourceMap: true
        },
        src: 'dist/OSMBuildings/<%=pkg.name%>.debug.js',
        dest: 'dist/OSMBuildings/<%=pkg.name%>.js'
      }
    },

    shaders: {
      dist: {
        src: 'src/shader',
        dest: 'src/Shaders.min.js',
        names: grunt.file.readJSON('config.json').shaders
      }
    },

    version: {
      dist: {
        src: './dist/OSMBuildings/<%=pkg.name%>.debug.js',
        mapping: {
          '{{VERSION}}': '<%=pkg.version%>'
        }
      }
    },

    clean: {
      dist: ['./dist/OSMBuildings/<%=pkg.name%>.pack.js']
    },

    jshint: {
      options: {
         globals: {}
       },
      all: grunt.file.readJSON('config.json').src
    },

    compress: {
      main: {
        options: {
          level: 5,
          archive: 'dist/<%=pkg.name%>-<%=pkg.version%>.zip'
        },
        files: [
          { expand: true, cwd: 'dist/', src: ['<%=pkg.name%>/*', 'index.html'] }
        ]
      }
    },

    // just testing, whether wepack *would* work
    webpack: {
      test: {
        entry: './dist/OSMBuildings/<%=pkg.name%>.debug.js',
        output: {
            path: './dist/OSMBuildings',
            filename: '<%=pkg.name%>.pack.js',
        },
        stats: false, // the stats output
        progress: false, // show progress
        failOnError: true, // don't report error to grunt if webpack find errors
        watch: false,
        keepalive: true // don't finish the grunt task
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-webpack');

  grunt.registerMultiTask('version', 'Set version number', function() {
    var config = this.data;

    var content = '' + fs.readFileSync(config.src);

    for (var tag in config.mapping) {
      content = content.replace(tag, config.mapping[tag]);
    }

    fs.writeFileSync(config.src, content);
  });

  grunt.registerMultiTask('shaders', 'Build shaders', function() {
    // grunt.log.writeln(JSON.stringify(this.data));
    var config = this.data;

    var src, name, Shaders = {};
    for (var i = 0; i < config.names.length; i++) {
      name = config.names[i];
      Shaders[name] = {};

      src = fs.readFileSync(config.src + '/' + name + '.vs', 'ascii');
      Shaders[name].vertex = src.replace(/'/g, "\'").replace(/[\r\n]+/g, '\n');

      src = fs.readFileSync(config.src + '/' + name + '.fs', 'ascii');
      Shaders[name].fragment = src.replace(/'/g, "\'").replace(/[\r\n]+/g, '\n');
    }

    fs.writeFileSync(config.dest, 'var Shaders = '+ JSON.stringify(Shaders) +';\n');
  });

  grunt.registerTask('default', 'Build shaders', function() {
    grunt.log.writeln('\033[1;36m'+ grunt.template.date(new Date(), 'yyyy-mm-dd HH:MM:ss') +'\033[0m');
    grunt.task.run('shaders');
  });

  grunt.registerTask('release', 'Release', function() {
    grunt.log.writeln('\033[1;36m'+ grunt.template.date(new Date(), 'yyyy-mm-dd HH:MM:ss') +'\033[0m');

    grunt.task.run('jshint');

    grunt.task.run('concat:glx');
    grunt.task.run('shaders');
    grunt.task.run('concat:osmb-basemap');
    grunt.task.run('version');
    grunt.task.run('uglify:osmb-basemap');

    grunt.task.run('copy:assets');
    grunt.task.run('copy:css');

    grunt.task.run('compress');
    grunt.task.run('webpack');
  });
};
