console.log('content-script')

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if(message && message.action === 'FETCH') {
    const md = generateMarkdownFromSelection()
    copyToClipboard(md);
    sendResponse({
      status: 'SUCCESS',
      message: `Copied to clipboard:\n${md}`
    })
  }
})

function generateMarkdownFromSelection() {
  // From tonyQ
  // Ref: https://gist.github.com/tony1223/478418a202e29fc16e17
  //

  function p2(text){
    return text < 10 ? "0"+text : text;
  }


  var { text } =  getContentFromSelection();
  // var text = content.substring(p.anchorOffset,p.extentOffset);
  var p = window.getSelection();
  var container = getContainedNode(p.anchorNode);

  if(!container){
    alert("no contained comment or post");
  }

  var res = "", now = new Date();
  if(container.type == "comment"){
    var author = getCommentAuthor(container.node);
    var timenode = getCommentTimeNode(container.node)
    var link = timenode.parentNode;
    var time = new Date(parseInt(timenode.dataset.utime,10)*1000);

    var timezone = -1* (now.getTimezoneOffset()/60);

    res = ("# "+ author+
      "\n## articles" +
      "\n### "+
      time.getFullYear()+"/"+p2(time.getMonth()+1)+"/"+p2(time.getDate())+" "+
      p2(time.getHours())+":"+p2(time.getMinutes())+" GMT"+p2(timezone > 0 ? "+"+timezone :"-"+timezone)+":00"
      +" "+link.href+"\n- "+text);
  }else{
    var author = getPostAuthor(container.node);
    var link = getPostUrl(container.node);
    var time = getPostTime(container.node);

    var timezone = -1* (now.getTimezoneOffset()/60);

    res = ("# "+ author+
      "\n## articles" +
      "\n### "+
      time.getFullYear()+"/"+p2(time.getMonth()+1)+"/"+p2(time.getDate())+" "+
      p2(time.getHours())+":"+p2(time.getMinutes())+" GMT"+p2(timezone > 0 ? "+"+timezone :"-"+timezone)+":00"
      +" "+link+"\n- "+text);
  }

  return res;
}

/* ----------------------- */
/* DOM node access methods */
/* ----------------------- */

// Input: an HTML node
// Output:
//  {
//    type: "comment" or "post",
//    node: The containing node representing post or comment,
//  }
//
function getContainedNode(node){
  var p = node;
  while(p){
    if(p && p.classList){

      if(
        p.classList.contains("UFIComment") ||
        p.getAttribute('aria-label') === 'Comment'
      ){
        return {type:"comment",node:p};
      }

      if(
        //p.getAttribute('role') === 'article'
        p.classList.contains("userContentWrapper")
      ){
        return {type:"post",node:p};
      }
    }
    p = p.parentNode;
  }
  return null;
}

// Input: the comment node that contains the selected lines
// Output: (string) the name of the author
//
function getCommentAuthor(commentNode) {
  return commentNode.querySelectorAll(".UFICommentActorName")[0].innerText
}

// Input: the comment node that contains the selected lines
// Output: (Node) the time anchor node
//
function getCommentTimeNode(commentNode) {
  return commentNode.querySelectorAll("[data-utime]")[0];
}

// Input: the post node that contains the selected lines
// Output: (string) the name of the author
//
function getPostAuthor(postNode) {
  return (
    postNode.querySelectorAll("h5")[0]
  ).innerText;
}

// Input: the post node that contains the selected lines
// Output: (Node) the time anchor node
//
function getPostTimeNode(postNode) {
  return postNode.querySelectorAll("[data-utime]")[0]
}

// Input: the post node that contains the selected lines
// Output: (Date) the time
function getPostTime(postNode) {
  // Use the old method to get the time from timenode
  const timeNode = getPostTimeNode(postNode);
  if (timeNode !== undefined) {
    return new Date(parseInt(timeNode.dataset.utime,10)*1000);
  } else {
    // try to get with the attribute
    const ts = postNode.getAttribute('data-timestamp');
    if (ts !== undefined) {
      return new Date(parseInt(ts,10)*1000);
    } else {
      // otherwise return current time to avoid crash
      return new Date();
    }
  }
}

// Input: the post node that contains the selected lines
// Output: (String) the url
function getPostUrl(postNode) {
  const postId = postNode.querySelectorAll(".commentable_item")[0].querySelectorAll("[name=ft_ent_identifier]")[0].getAttribute("value");
  return `https://www.facebook.com/${postId}`;
}


// Get the text from the nodes between anchorNode and focusNode with this stackoverflow piece of code
// https://stackoverflow.com/questions/4636919/how-can-i-get-the-element-in-which-highlighted-text-is-in
// Input: Selection
// Output: (String) the full text content
function getContentFromSelection() {
    var text = "", containerElement = null;
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var node = sel.getRangeAt(0).commonAncestorContainer;
            containerElement = node.nodeType == 1 ? node : node.parentNode;
            text = sel.toString();
        }
    } else if (typeof document.selection != "undefined" &&
               document.selection.type != "Control") {
        var textRange = document.selection.createRange();
        containerElement = textRange.parentElement();
        text = textRange.text;
    }
    return {
        text: text,
        container: containerElement
    };
}

/* ----------------- */
/* Utility functions */
/* ----------------- */

function copyToClipboard(text) {
  // Ref: https://gist.github.com/joeperrin-gists/8814825
  //

  const textarea = document.createElement('textarea');
  textarea.style.position = 'fixed';
  textarea.style.opacity = 0;
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('Copy');
  document.body.removeChild(textarea);
};
