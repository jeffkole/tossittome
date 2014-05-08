(function(){
  var d=document,
      s=d.createElement('scr'+'ipt'),
      b=d.body,
      l=d.location,
      i='titom2';
  try{
    if(!b)throw(0);
    s.setAttribute('id',i);
    s.setAttribute('src',l.protocol+'//{{ host }}/toss?s='+i);
    b.appendChild(s);
  }catch(e){
    alert('Please wait until the page has loaded.');
  }
})();
