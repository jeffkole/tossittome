function titom1(){
  var d=document,
      s=d.createElement('scr'+'ipt'),
      b=d.body,
      l=d.location;
  try{
    if(!b)throw(0);
    d.title='(Tossing...) '+d.title;
    s.setAttribute('src',l.protocol+'//{{ host }}/toss?s='+encodeURIComponent(l.href)+'&t={{ token }}');
    b.appendChild(s);
  }catch(e){
    alert('Please wait until the page has loaded.');
  }
};
titom1();
void(0)
