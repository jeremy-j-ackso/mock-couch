module.exports = (grunt) => {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      target: ['package.json', 'Gruntfile.js', 'index.js', 'lib/**/*.js', 'test/**/*.js'],
    },
    jasmine_nodejs: {
      options: {
        specNameSuffix: 'spec.js',
      },
      all: {
        specs: [
          'test/*.spec.js',
        ],
      },
    },
  });

  // grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-jasmine-nodejs');

  // Default task(s).
  grunt.registerTask('default', [
    'eslint',
    'jasmine_nodejs',
  ]);
};
