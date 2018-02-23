/**
 * Created by wuyang on 16/5/8.
 */

//数据折线构造函数
function createDataMap(gd,cm,ox,oy,w,h){
    this.ox = ox;
    this.oy = oy;
    this.w = w;
    this.h = h;
    this.gd = gd;
    this.gd.DataMap = [];

    this.cm = cm; // 坐标轴对象作为参数传入hoverDataMap对象中
    this.imagebg; // 预留一张没有数据的图片作为背景

    this.max; //数据集体里最大的数

    this._cacheData=[];//将drawDataMap的值放到缓存里,回头集体画出来.


    //启动表格的鼠标移动事件
    this.oHover = new hoverDataMap(gd,this.cm);

}

//将所有数据设置到内存上
createDataMap.prototype.drawDataMap = function(color,res){
    var dataMap = {};

    var resdata = res.ret_set[0].monitor_info.default.data;
    var l = resdata.length;
    var m = Math.max.apply(null,resdata);

    dataMap.instance_id = res.ret_set[0].instance_id;
    dataMap.display_name = res.ret_set[0].display_name;
    dataMap.timestamp = res.ret_set[0].timestamp;

    dataMap.color = color;

    dataMap.resdata = resdata;


    this.gd.DataMap.push(dataMap); //将所有data数据添加道dataMap对象上

    this.imagebg = this.cm.getImageBackground(this.gd);

    this.setCacheData(dataMap);



};

createDataMap.prototype.setCacheData = function(cache){
    this._cacheData.push(cache);
};
createDataMap.prototype.getCacheData = function(){
    return this._cacheData;
};


//启动画
createDataMap.prototype.starDraw = function(animation){

    var animation = animation; //是否动画启动数据
    var aData = this.getCacheData();

    this.max = this.setScale(aData);

    if(animation){
        this.animation(aData,function () {
            this.oHover.init();
        });
    }else{

        this.drawLine(aData,function(){
            this.oHover.init();
        });
    }
};

//设置所有的数据比例,并且返回最大值
createDataMap.prototype.setScale = function(adata){
    //需要找一下aData里面数据的最大值
    var max = 0,m;
    for(var i=0;i<adata.length;i++){
        max = max > (m = Math.max.apply(null,adata[i].resdata)) ? max : m;
    }

    for(var i=0;i<adata.length;i++){
        adata[i]["d"] = {};
        for(var j=0,l=adata[i].resdata.length;j<l;j++){
            var y = ((max-adata[i].resdata[j])/max)*this.h+this.oy;
            var x = j/l*this.w+this.ox;
            adata[i]["d"][parseInt(x)] = {};
            adata[i]["d"][parseInt(x)].v = adata[i].resdata[j];
            adata[i]["d"][parseInt(x)].x = x;
            adata[i]["d"][parseInt(x)].y = y;
        }

    }
    return max;
}

//直接画
createDataMap.prototype.drawLine = function(adata,cbfun){


    for(var d=0,dl=adata.length;d<dl;d++){
        this.gd.save();
        this.gd.beginPath();
        this.gd.translate(0.5,0.5);
        this.gd.lineWidth = 3;

        var resdata = adata[d].resdata;;
        var lint_s = 0;
        var l = resdata.length;
        var m = this.max;
        this.gd.strokeStyle = adata[d].color;
        for(var i=0;i<l;i++){
            if(resdata[i] === null) {
                lint_s = 0;
            }else{
                var y = ((m-resdata[i])/m)*this.h+this.oy;
                var x = i/l*this.w+this.ox;
                if(lint_s === 0){
                    this.gd.moveTo(x,y);
                }else{
                    this.gd.lineTo(x,y);
                }
                lint_s++;
            }


        }
        this.gd.stroke();
        this.gd.restore();
    }

    cbfun.apply(this);
}

//带有动画的画
createDataMap.prototype.animation = function(adata,cbfun){
    var _this = this;
    var timer = null;
    var state_x=1;
    var cbfun = cbfun || function(){};
    //初始化的线运动
    function ss(){

        var start_x = _this.ox;
        var start_y = _this.oy+_this.h/2;
        var end_x = _this.ox + _this.w;
        var end_y = start_y;
        state_x++;
        var _x = Math.tween.Quad.easeInOut(state_x,start_x,end_x,50);

        _this.gd.save();
        _this.gd.beginPath();
        _this.gd.translate(0.5,0.5);
        _this.gd.lineWidth = 3;
        _this.gd.strokeStyle = adata[0].color;
        _this.gd.moveTo(start_x,start_y);
        _this.gd.lineTo(_x,end_y);
        _this.gd.stroke();
        _this.gd.restore();
        if(_x>=end_x){
            //cbfun.apply(_this);
            moveLine.apply(_this);
            return false;
        }
        requestAnimFrame(ss);
    }
    ss();

    //从线变为折线的运动

    function moveLine(){
        var state_y = 1;
        var _this = this;

        function moveLineSs(){

            _this.cm.clearMap(_this.gd);
            _this.cm.setImageBackground(_this.gd,_this.imagebg);

            //遍历每一条线

            for(var i=0,a_i=adata.length;i<a_i;i++){

                _this.gd.save();
                _this.gd.beginPath();
                _this.gd.translate(0.5,0.5);
                _this.gd.lineWidth = 3;
                _this.gd.strokeStyle = adata[i].color;

                //遍历线上每一个值
                var resdata = adata[i].resdata;
                var lint_s = 0;
                for(var j=0,a_j=resdata.length;j<a_j;j++){

                    var m = _this.max;
                    if(resdata[j] === null) {
                        lint_s = 0;
                    }else {
                        var _y = ((m - resdata[j]) / m) * _this.h + _this.oy;
                        var start_y = _this.oy + _this.h / 2;
                        var y = Math.tween.Quad.easeInOut(state_y, start_y, _y - start_y, 100);
                        var x = j / a_j * _this.w + _this.ox;

                        if (lint_s == 0) {
                            _this.gd.moveTo(x, y);
                        } else {
                            _this.gd.lineTo(x, y);
                        }
                        lint_s++;



                    }
                }

                _this.gd.stroke();
                _this.gd.restore();

            }

            if (state_y >= 100 || state_y <= -100) {
                cbfun.apply(_this);
                return false;
            } else {
                state_y++;

            }



            requestAnimFrame(moveLineSs);
        }
        moveLineSs();
    }
};
