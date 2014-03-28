function titom1(){
  var d=document,
      s=d.createElement('scr'+'ipt'),
      b=d.body,
      l=d.location,
      t=d.title;
  try{
    if(!b)throw(0);
    d.title='(Tossing...) '+d.title;
    s.setAttribute('src',l.protocol+'//{{ host }}/toss?u='+encodeURIComponent(l.href)+'&i='+encodeURIComponent(t)+'&t={{ token }}');
    b.appendChild(s);
  }catch(e){
    alert('Please wait until the page has loaded.');
  }
};
titom1();
void(0)
