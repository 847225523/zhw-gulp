const {dest,src,parallel,series,watch}=require('gulp')
// const sass=require('gulp-sass')
// const babel=require('gulp-babel')
// const swig=require('gulp-swig')
// const imagemin=require('gulp-imagemin')
//用于删除文件
const del=require('del')
//用于自动加载插件
const loadPlugins=require('gulp-load-plugins')
const plugins=loadPlugins()
//用于代码热更新
const browserSync=require('browser-sync')
// 寻找当前工作目录
const cwd=process.cwd()
let config={
  //default config
  build:{
    src:'src',
    dist:'dist',
    temp:'temp',
    public:'public',
    paths:{
      styles:'assets/styles/*.scss',
      scripts:'assets/scripts/*.js',
      pages:'*.html',
      images:'assets/images/**',
      fonts:'assets/fonts/**',
    }

  }
}
try{
  const loadConfig=require(`${cwd}/pages.config.js`)
  config=Object.assign({},config,loadConfig)
}catch(e){
  
}
//创建一个开发服务器
const bs=browserSync.create()
  const clean=()=>{
      return del([config.build.dist,config.build.temp])
  }
//处理css代码
const style=()=>{
    return src(config.build.paths.styles,{base:config.build.src,cwd:config.build.src})
    // .pipe(sass())
    //让代码展开
    .pipe(plugins.sass({outputStyle:'expanded'}))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({stream:true}))
}
const script=()=>{
    return src(config.build.paths.scripts,{base:config.build.src,cwd:config.build.src})
    //把代码转换为es5
    // .pipe(plugins.babel({presets:['@babel/preset-env']}))
    .pipe(plugins.babel({presets:[require('@babel/preset-env')]}))
    .pipe(dest(config.build.temp))
    // 也可以用流的方式直接监控
    .pipe(bs.reload({stream:true}))
}
const page=()=>{
    return src(config.build.paths.pages,{base:config.build.src,cwd:config.build.src})
    .pipe(plugins.swig({data:config.data}))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({stream:true}))
}
const image=()=>{
    return src(config.build.paths.images,{base:config.build.src,cwd:config.build.src})
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const font=()=>{
    return src(config.build.paths.fonts,{base:config.build.src,cwd:config.build.src})
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}
// 处理其他的文件
const extra=()=>{
    return src('**',{base:config.build.public,cwd:config.build.src})
    .pipe(dest(config.build.dist))
}
//用于热更新
const server=()=>{
    watch(config.build.paths.styles,{cwd:config.build.src},style)
    watch(config.build.paths.scripts,{cwd:config.build.src},script)
    watch(config.build.paths.pages,{cwd:config.build.src},page)
    //图片，字体等不需要每次编译
    // watch('src/assets/images/**',image)
    // watch('src/assets/fonts/**',font)
    // watch('public/**',extra )
 
    watch([config.build.paths.images,config.build.paths.fonts],{cwd:config.build.src},bs.reload)
    watch('**',{cwd:config.build.public},bs.reload)

    bs.init({
        notify:false,// 主要是隐藏右上角的弹出框
        port:3001,
        open:true, //是否自动打开浏览器
        // files:'dist/**',
        server:{
            baseDir:[config.build.temp,config.build.src,config.build.public],
            //指定路由
            routes:{
                '/node_modules':'node_modules'
            },
        }
    })
}


const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    // html js css
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest(config.build.dist))
}

//开发的任务
const compile=parallel(style,script,page)

//上线之前的任务
const build=series(clean,parallel(
    series(compile,useref),
    extra,
    image,
    font))

const develop=series(compile,server)
module.exports={
    build,
    clean,
    develop,
}