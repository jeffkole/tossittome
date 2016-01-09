(function(){
  var d=document,
      s=d.createElement('scr'+'ipt'),
      b=d.body,
      l=d.location,
      i='titom3',
      h=function () {
        l.assign(l.protocol+'//{{ host }}/toss?u='+encodeURIComponent(l.href)+'&i='+encodeURIComponent(d.title)+'&h=true');
      };
  try{
    if(!b)throw(0);
    s.setAttribute('id',i);
    s.setAttribute('src',l.protocol+'//{{ host }}/toss?s='+i);
    s.onerror=h;
    b.appendChild(s);
  }catch(e){
    alert('Please wait until the page has loaded.');
  }
})();
