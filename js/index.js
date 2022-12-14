let maskEl=$('#mask')[0]; 
 
let maskInfo ={  //用于存储c遮罩层的信息
   isShow: false  , //遮罩层是否显示 默认否
   isSelectMode:true,//是否是选择模式  true 为选择 false 为取消
   left:0, //遮罩层的left
   width:0, //遮罩层的宽，默认0
   rightBoundary:0, //遮罩层的右边界  rightBoundary = left + width  
   top:0,
   height:0,
   bottomBoundary:0 //下边界   bottomBoundary = top + height
}
let selectedLists= new Set([]);//拖拽多选选中的块集合 防止集合中有重复元素，这里选用set
// 鼠标按下时开启拖拽多选，将遮罩定位并展现


$(".list").mousedown(function(event) {

   //屏蔽官方的右键菜单
   $(".list")[0].oncontextmenu = function(){return false;}

  maskInfo.isShow=event.which ===3? true:false;  //鼠标右键键选中
  maskEl.style.top = event.pageY -  event.currentTarget.offsetTop +'px';
  maskEl.style.left = event.pageX -  event.currentTarget.offsetLeft +'px';
  maskInfo.left=event.pageX;
  maskInfo.top=event.pageY;
  // event.preventDefault();  // 阻止默认行为
  event.stopPropagation(); // 阻止事件冒泡
});


// 鼠标移动时计算遮罩的位置，宽 高
$(".list").mousemove(function(event) {
    if(!maskInfo.isShow) return;//只有开启了拖拽，才进行mouseover操作
    const distanceX = maskInfo.left - event.pageX
    const distanceY = maskInfo.top - event.pageY
    if (distanceX >0) maskEl.style.left = event.pageX -  event.currentTarget.offsetLeft + 'px'  //向左移动
    
    maskEl.style.width = Math.abs(distanceX)  + 'px'
    maskInfo.width = Math.abs(distanceX)
    if (distanceY > 0 )  maskEl.style.top = event.pageY -  event.currentTarget.offsetTop + 'px' //鼠标向上

    maskInfo.isSelectMode = (distanceY > 0 || distanceX >0 ) ? false:true
          
    maskEl.style.height = Math.abs(distanceY) + 'px';
    maskInfo.height = Math.abs(distanceY)

    // event.preventDefault();  // 阻止默认行为
    event.stopPropagation(); // 阻止事件冒泡
});

//鼠标抬起时计算遮罩的right 和 bottom，找出遮罩覆盖的块，关闭拖拽选中开关，清除遮罩数据
$(".list").mouseup(function(event) {
 if(!maskInfo.isShow) return;//只有开启了拖拽，才进行mouseover操作
   if (maskInfo.left > event.pageX) maskInfo.left = event.pageX
   if (maskInfo.top > event.pageY) maskInfo.top = event.pageY

   maskInfo.rightBoundary = maskInfo.left + maskInfo.width
   maskInfo.bottomBoundary =maskInfo.top + maskInfo.height

  findSelected();
  resetMask();  //重置遮罩层数据
  handleDrapable() //拖拽事件绑定
  // event.preventDefault();  // 阻止默认行为
  event.stopPropagation(); // 阻止事件冒泡
});

//鼠标离开
$(".list").mouseleave(function(event) {
    resetMask()
    event.preventDefault();  // 阻止默认行为
    // event.stopPropagation(); // 阻止事件冒泡
});
function findSelected(){
    let lists=$('.list').find('li');
    for(let i=0;i<lists.length;i++){
        //计算每个块的定位信息
        let left=$(lists[i]).offset().left;
        let rightBoundary=$(lists[i]).width()+left;
        let top=$(lists[i]).offset().top;
        let bottomBoundary=$(lists[i]).height()+top;
        //判断每个块是否被遮罩盖住（即选中） 只要有任意一个部位被遮住，即选中
        let leftIn = maskInfo.left <= left && left <= maskInfo.rightBoundary;  //元素的左侧在遮罩层中  
        let rightIn = maskInfo.left <= rightBoundary && rightBoundary <= maskInfo.rightBoundary;  //元素的右侧在遮罩层中
        let topIn =  maskInfo.top <= top && top <= maskInfo.bottomBoundary;  //元素的上侧在遮罩层中 
        let bottomIn= maskInfo.top <= bottomBoundary && bottomBoundary <= maskInfo.bottomBoundary;  //元素的下侧在遮罩层中

        let topAndBottomOut = maskInfo.top >= top && bottomBoundary >= maskInfo.bottomBoundary //元素上下边框都不在遮罩层中
        let leftAndRightOut = maskInfo.left >= left && rightBoundary >= maskInfo.rightBoundary //元素左右边框都不在遮罩层中

        let onlyLeftIn = leftIn &&  topAndBottomOut   //只有左侧在遮罩层中
        let onlyRightIn = rightIn && topAndBottomOut  //只有右侧在遮罩层中
        let leftAndRightIn = maskInfo.left <= left && rightBoundary <= maskInfo.rightBoundary && topAndBottomOut  //只有左和右侧在遮罩层中
      
        let onlyTopIn = topIn && leftAndRightOut //只有上侧在遮罩层中
        let onlyBottomIn = bottomIn && leftAndRightOut //只有下侧在遮罩层中
        let bottomAndTopIn = maskInfo.top <= top && bottomBoundary <=maskInfo.bottomBoundary && leftAndRightOut  //只有上和下侧在遮罩层中
        
        let allInEL = left <= maskInfo.left && rightBoundary >= maskInfo.rightBoundary && top <= maskInfo.top && bottomBoundary >= maskInfo.bottomBoundary//遮罩层全部在某个元素内部

        //左上，左下，右上，上右下，任意一个角在遮罩层中或者遮罩层在某个元素内部，都为被选中元素
        if(((leftIn || rightIn) && (topIn || bottomIn)) || onlyLeftIn || onlyRightIn || bottomAndTopIn || leftAndRightIn || onlyTopIn || onlyBottomIn || allInEL){   //左上，左下，右上，上右下，任意一个角在遮罩层中或者遮罩层在某个元素内部，都为被选中元素
           if (maskInfo.isSelectMode) {
            selectedLists.add(lists[i]);
            $(lists[i]).addClass('selected');
            lists[i].setAttribute('draggable','true')
           }else{
            selectedLists.delete(lists[i]);
            $(lists[i]).removeClass('selected');
            lists[i].setAttribute('draggable','false')
           }
        }
    }
}

function resetMask(){
  maskInfo.isShow = false;
  maskInfo.left=0, //遮罩层的left
  maskInfo.width=0, //遮罩层的宽，默认0
  maskInfo.rightBoundary=0, //遮罩层的右边界  rightBoundary = left + width  
  maskInfo.top=0,
  maskInfo.height=0,
  maskInfo.bottomBoundary=0 //下边界   bottomBoundary = top + height
  maskEl.style.width=0;
  maskEl.style.height=0;
  maskEl.style.top=0;
  maskEl.style.left=0;
}

//拖拽事件逻辑
let currentDragDom  = null

function handleDrapable() {
  selectedLists.forEach(el =>{
     el.addEventListener('dragstart', dragStart);
     el.addEventListener('dragend', dragEnd);

  })
} 

const droppables = document.querySelectorAll('.list');
// 监听droppable的相关事件
for (const droppable of droppables) {
  droppable.addEventListener('dragover', dragOver);
  droppable.addEventListener('dragleave', dragLeave);
  droppable.addEventListener('dragenter', dragEnter);
  droppable.addEventListener('drop', dragDrop);
}
function dragStart() {
  //firefox设置了setData后元素才能拖动！！！！
 //event.target出发事件的元素
 event.dataTransfer.setData("te", event.target.innerText); //不能使用text，firefox会打开新tab
 currentDragDom = event.target;
 currentDragDom.classList.add('dragging')
}
function dragEnd() {
  currentDragDom.classList.remove('dragging')
}
function dragOver(e) {
  //取消默认行为
  event.preventDefault();
  let target = event.target;
  //因为dragover会发生在ul上，所以要判断是不是li
  if (target.nodeName === "LI" && target !== currentDragDom) {
      if (target && target.animated)  return;
        //getBoundingClientRect()用于获取某个元素相对于视窗的位置集合
      let targetRect = target.getBoundingClientRect();
      let dragingRect = currentDragDom.getBoundingClientRect();
      console.log(target.nextSibling)
      if (_index(currentDragDom) < _index(target)) {
          //nextSibling 属性可返回某个元素之后紧跟的节点（处于同一树层级中）。
          target.parentNode.insertBefore(currentDragDom, target.nextSibling);
      } else {
          target.parentNode.insertBefore(currentDragDom, target);
      }
      addAnimate(dragingRect, currentDragDom);
      addAnimate(targetRect, target);
    
  }
}

function dragEnter(e) {
  e.preventDefault();
}

function dragLeave(e) {

}

function dragDrop(e) {
  //判断是  拖动元素至另一个容器还是改变顺序
  //node.contains(el) 查找该节点是否存在后代节点el 存在返回true 否则为false
  if(!e.target.contains(currentDragDom))   this.append(currentDragDom);
    
}
//获取元素在父元素中的index
function _index(el) {
 let index = 0;
 if (!el || !el.parentNode) {
     return -1;
 }
 //previousElementSibling属性返回指定元素的前一个兄弟元素（相同节点树层中的前一个元素节点）。
 while (el && (el = el.previousElementSibling)) {
     //console.log(el);
     index++;
 }
 return index;
}

function addAnimate(prevRect, target) {
 let ms = 300;
 if (ms) {
     let currentRect = target.getBoundingClientRect();
    //nodeType 属性返回以数字值返回指定节点的节点类型。1=元素节点  2=属性节点
     if (prevRect.nodeType === 1) prevRect = prevRect.getBoundingClientRect();

     addStyle(target, 'transition', 'none');
     addStyle(target, 'transform', 'translate3d(' +
         (prevRect.left - currentRect.left) + 'px,' +
         (prevRect.top - currentRect.top) + 'px,0)'
     );

     target.offsetWidth; // 触发重绘
     addStyle(target, 'transition', 'all ' + ms + 'ms');
     addStyle(target, 'transform', 'translate3d(0,0,0)');

     clearTimeout(target.animated);
     target.animated = setTimeout(function() {
      addStyle(target, 'transition', '');
      addStyle(target, 'transform', '');
         target.animated = false;
     }, ms);
 }
}
//给元素添加style
function addStyle(el, prop, val) {
  let style = el && el.style;
  if (style) {
    if (val === void 0) {
      //使用DefaultView属性可以指定打开窗体时所用的视图
      if (document.defaultView && document.defaultView.getComputedStyle) {
          val = document.defaultView.getComputedStyle(el, '');
      } else if (el.currentStyle) {
          val = el.currentStyle;
      }
      return prop === void 0 ? val : val[prop];
    } else {
      if (!(prop in style)) {
          prop = '-webkit-' + prop;
      }
      style[prop] = val + (typeof val === 'string' ? '' : 'px');
    }
  }
}