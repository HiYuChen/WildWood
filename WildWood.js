//author: xiang wei    112219306@qq.com
//someone may ask: so many successful products is there, vue and angular is perfect. why make this one?
//it is simple, it is smaller, and it is faster. So it is here.
//Other similar component usually replace the whole dom object when loading. So they will remove the event handlers and user defined variables on doms. So they may have problems with some UI components. The templete synax is almost same as vue. 
/*
function findNodes(el, slt) {
    var arr = []; 
    function _find(el, slt) {
        if (slt.indexOf('#') === 0) {
            var name = slt.substr(1, slt.length - 1);
            if (el.id === name || el.name === name) {
                arr.push(el);
            }
        }
        if (el.children) {
            el.children.forEach(function (node) {
                _find(node, slt);
            }); 
        }
    }
    _find(el, slt);
    return arr; 
}
*/
function WildWood(ww) {
    this.ww = ww;     
    function insertAfter(newEle, targetEle) { 
        var parent = targetEle.parentNode; 
        if ( parent.lastChild == targetEle  ) {   
            parent.appendChild(newEle);
        } else {   
            parent.insertBefore(newEle, targetEle.nextSibling);
        }
    } 
    /*String.prototype.fillVars = function (dataObj, objName) {
        var result = this; var reg;
        for (var key in dataObj) {
            if (dataObj[key] !== undefined) {
                var prefix = '';
                if (objName) {
                    prefix = objName + '.';
                }
                reg = new RegExp("({{" + prefix + key + "}})", "g");
                result = result.replace(reg, dataObj[key]);
            }
        }
        return result;
    }*/
    var fillVars = function (str,dataObj, objName) { 
        var nf = 0, subFor1=-1,subFor2=-1;
        nf = str.indexOf(' v-for=', 0);
        if (nf >= 0) {
            nf = str.indexOf(' v-for=', nf + 1);
            if (nf > 0) {
                var nn = str.lastIndexOf('<', nf);
                if (nn > 0) {
                    var nm = str.indexOf(' ', nn);
                    if (nm > 0) {
                        var tag = str.substring(nn+1, nm); var ct = 0;
                        for (var ii = nn; ii < str.length; ii++) {
                            var tt = str.substr(ii, tag.length + 2);
                            if (tt == "<" + tag + '>' || tt == "<" + tag + ' ') {
                                ct++;
                            }
                            else if (tt == '</' + tag) {
                                ct--;
                            }
                            if (ct === 0) {
                                subFor1 = nn; subFor2 = ii;
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        var n = 0,n1=0,n_pre=0; var arrVars = [];
        var res = '';
        while (n >= 0 && n1 >= 0 && n_pre <= str.length - 1) {
            n = str.indexOf('{{', n_pre);
            var bInSubFor = false;
            if (subFor1 > 0 && n > subFor1 && n < subFor2) bInSubFor = true;
           
           if (n >= 0 ) {
               res += str.substring(n_pre, n);
               n1 = str.indexOf('}}', n + 1);
                if (n1 > n) {
                    var vn = str.substring(n + 2, n1);
                    var vv = '{{'+vn+'}}';
                    if (!bInSubFor) {
                        vv = evil("with(varObj){return " + vn + "}", 'varObj', ww.data, objName, dataObj);
                    } 
                    res += vv; 
                    n_pre = n1+2;
                } 
            } else {
               res += str.substring(n_pre, str.length); 
            } 
        } 
        return res;
    }
    function createNode(htmlStr) {
        var div = document.createElement("div");
        div.innerHTML = htmlStr;
        return div.childNodes[0];
    }
    function evil(code, argName1, argValue1, argName2, argValue2) {
        code = code.replace(new RegExp('&gt;', "g"), '>');
        code = code.replace(new RegExp('&lt;', "g"), '<'); 
        code = code.replace(new RegExp('&amp;', "g"), '&'); 
        //var fn = Function;
        if (!argName1) argName1 = undefined;//for tencent x5 browser '' is invalid
        if (!argName2) argName2 = undefined; 
        return new Function(argName1, argName2, code)(argValue1, argValue2);
    }
    var eleName = ww.el;
    ww.el = document.querySelector(ww.el);
    if (!ww.el) {
        throw Error(eleName + ' does not exist');
    }
    var g_lstElVar = new Array();
    WildWood.prototype.getLstElVar = function () {
        return g_lstElVar;
    };
    var forElVar = null;
    //bind elements to wildwood 
    function bindElVars(el, data, lstElVar, tmpFor) {
        if (tmpFor) {
            forElVar = tmpFor.mumFor;
        }
        if (!el) {
            return;
        }
        var bCurrentIsFor = false;
        if (el.attributes) {
            var modelVar = null; var md = null;
           // el.attributes.forEach(function (v, k) {
            for (k in el.attributes) {
                v = el.attributes[k]; 
                var attr = el.attributes[k];
                var v = attr.value; var n = attr.name; 
                if (!n || !v) continue;
                var elvar = null; 
                if (n === 'v-for') {
                    var arr = v.split(' in ');
                    if (arr.length === 2) {
                        bInFor = true; bCurrentIsFor = true;
                        forElVar = { tp: 'for', el: el, forVar: arr[0], inVar: arr[1], outerHTML: el.outerHTML, mumFor: forElVar, tmpFor: tmpFor, lastEl: el };
                        if (!tmpFor) {
                            el.style.display = "none"; 
                        }
                        forElVar.data = data;
                        lstElVar.push(forElVar);
                    }
                }
                else if (n === 'v-if') {
                    elvar = { tp: 'if', el: el, var: v, forElVar: forElVar, data: data, origDisplay: el.style.display };
                    lstElVar.push(elvar); 
                } 
                else if (n === 'v-model') {
                    modelVar = v;
                    elvar = { tp: 'model', el: el, var: v, forElVar: forElVar, data: data };
                    lstElVar.push(elvar);
                } 
                else if (n === 'v-html') {
                    elvar = { tp: 'html', el: el, var: v, forElVar: forElVar, data: data };
                    lstElVar.push(elvar);
                } 
                else if (n === 'v-bind:value' || n === ':value') {
                    elvar = { tp: 'bind:value', el: el, var: v, forElVar: forElVar, data: data };
                    lstElVar.push(elvar);
                }
                else if (n === 'v-bind:style' || n=== ':style') {
                    elvar = { tp: 'bind:style', el: el, var: v, forElVar: forElVar, data: data };
                    lstElVar.push(elvar);
                }
                else if (n === 'v-bind:class' || n === ':class') {
                    elvar = { tp: 'bind:class', el: el, var: v, forElVar: forElVar, data: data };
                    lstElVar.push(elvar);
                }
                else if (n.indexOf('v-bind:') === 0 || n.indexOf(':') === 0) {
                    var a = n.split(':')[1];
                    //if (a === 'disabled')
                      //  debugger;
                    elvar = { tp: 'bind:' + a, el: el, var: v, forElVar: forElVar, data: data };
                    lstElVar.push(elvar);
                }
                else if (n === 'v-on:change') {
                    var vv = v.split('(');
                    vv = vv[0];
                    if (ww.methods && ww.methods[vv])
                        md = ww.methods[vv];

                    elvar = { tp: 'on:change', el: el, var: v, forElVar: forElVar, data: data }
                    lstElVar.push(elvar);
                }
                else if (n.indexOf('v-on:') === 0) {
                    var origEvt = n.split(':')[1];
                    var vv = v.split('(');
                    vv = vv[0];
                    if (ww.methods && ww.methods[vv]) {
                        var method = ww.methods[vv];
                        el['on' + origEvt] = function (evt) {
                            if (method) {
                                method(data,evt);
                            }
                        };
                        elvar = { tp: 'on:' + origEvt, el: el, var: v, forElVar: forElVar, data: data }
                        lstElVar.push(elvar);
                    } else {
                        throw Error('method ' + vv + ' not exist');
                    }
                   
                }
            }
    
            if (modelVar || md) {
                el.onchange = function (evt) { 
                    if (modelVar) {
                        var val = el.value;
                        if (el.type==='checkbox') val = el.checked;
                 
                        if (modelVar.indexOf('.') === -1) {
                            ww.data[modelVar] = val;
                        }
                        else {
                            var modelVar1 = modelVar.split('.')[1];
                            data[modelVar1] = val;
                        }
                    }
                    if (md) {
                        md(data);
                    }
                };
            } 
        } 
        if (el.innerHTML && el.innerHTML.indexOf('m_docTitle') >= 0) {
          //  debugger;
        }
        if (!el.children || el.children.length === 0) {
            if (!el.children) {
                var iiii = 1;
            }
            if (el.innerHTML && el.innerHTML.indexOf('<') === -1 && el.innerHTML.indexOf('{{') >= 0) {
                lstElVar.push({ tp: 'innerHTML', el: el, innerHTML: el.innerHTML, forElVar: forElVar, data: data });
            }
        }
        else {
            for (var i = 0; i < el.children.length; i++) { 
                bindElVars(el.children[i], data, g_lstElVar, null);
            }
        }
        if (bCurrentIsFor) {
            forElVar = forElVar.mumFor;
        }
    }
    bindElVars(ww.el, ww.data, g_lstElVar, null);

    function updateElByVar(dataObj, pn, pv, bIgnoreFor) { 
        var dataObjOrig = dataObj;
        var arrRemoveEv = [];
        var len = g_lstElVar.length;
        for (var i = 0; i < len;i++) {
            var ev = g_lstElVar[i]; 
            dataObj = dataObjOrig;
            var objName = '';
            var varName = pn;
            if (ev.innerHTML && ev.innerHTML.indexOf(pn) >= 0 && pn.indexOf('m_docTitle')>=0) {
              // debugger;
            }
            if (ev.var && ev.var.indexOf(pn) >= 0 && pn.indexOf('m_bankSearch') >= 0) {
               // debugger;
            }
            if (dataObj !== ww.data) {
                if(ev.data !== dataObj )  
                    continue;
                if (ev.forElVar) {
                    
                    if (ev.var && ev.var.indexOf('.') === -1) {
                        //using global var

                    }
                } 
            }
            if (ev.innerHTML && ev.innerHTML.indexOf(pn) >= 0 && pn.indexOf('praise_count') >= 0) {
               // debugger;
            }
            if (ev.forElVar) {
                if (!ev.forElVar.tmpFor) continue;  
            }
            if (ev.forElVar || ev.tp=='for') { 
                dataObj = ev.data;
                if (ev.forElVar ) {
                    objName = ev.forElVar.forVar;
                    if (dataObjOrig !== ww.data)
                        varName = objName + '.' + varName;
                }  
            }
            
            if (ev.tp === 'model' && ev.var === varName) {
                if (ev.el.type === 'radio') {
                    if (ev.el.value === pv) {
                        ev.el.checked = true;
                    }
                }
                else if (ev.el.type === 'checkbox') {
                    ev.el.checked = pv; 
                }
                else if (ev.el.tagName === 'DIV') {
                    ev.el.innerHTML = pv; 
                }
                else
                    ev.el.value = pv;
            } 
            else if (ev.tp === 'innerHTML' && ev.innerHTML.indexOf(varName) >= 0) { 
                if (ev.innerHTML.indexOf('comment.nickname') >= 0) {
                   //  debugger;
                } 
                ev.el.innerHTML = fillVars(ev.innerHTML, dataObj, objName);
                var ttt = 7;
            }
            else if (ev.tp === 'html' && ev.var === varName) {
                ev.el.innerHTML = pv;
            } 
            else if (ev.tp === 'if' && ev.var.indexOf(varName)>=0) {
                var bShow = evil("with(varObj){return " + ev.var + "}", 'varObj', ww.data, objName, dataObj); 
                if (bShow) ev.el.style.display = ev.origDisplay;
                else ev.el.style.display = "none";
            }
            else if (ev.tp === 'bind:value' && ev.var.indexOf(varName)>=0) {
                ev.el.value  = evil("with(varObj){return " + ev.var + "}", 'varObj', ww.data, objName, dataObj); 
                //ev.el.value = pv;
            }
            else if (ev.tp === 'bind:style') {
                if (ev.var.indexOf(varName) >= 0) {
                    var obj = null;
                    //var dt = ww.data; 
                    obj = evil("with(varObj){return " + ev.var + "}", 'varObj', ww.data, objName, dataObj);
                    if (ev.var.indexOf('{') >= 0) {

                        //obj = JSON.parse(ev.var);  
                    }
                    else if (ev.var === pn) {
                        // obj = pv;  
                    }

                    for (var n in obj) {
                        var v = obj[n];
                        ev.el.style[n] = v;
                    }
                }
            }
            else if (ev.tp === 'bind:class' && ev.var.indexOf(varName) >= 0) {
                var obj = null;
                obj = evil("with(varObj){return " + ev.var + "}", 'varObj', ww.data, objName, dataObj);
                if (ev.var.indexOf('{') >= 0) {
                   // obj = JSON.parse(ev.var);
                }
                else if (ev.var === pn) {
                 //   obj = pv;
                }
                for (var n in obj) {
                    var v = obj[n];
                    //var vv = evil("with(varObj){return " + v + "}", 'varObj', ww.data, objName, dataObj);
                    var vv = v;
                    if (vv) {
                        if (!ev.el.classList.contains(n)) {
                            ev.el.classList.add(n);
                        }
                    }
                    else if (ev.el.classList.contains(n)) {
                        ev.el.classList.remove(n);
                    }
                }
            }
            else if (ev.tp.indexOf('bind:') === 0 && ev.var.indexOf(varName)>=0) {
                var attr = ev.tp.split(':')[1];
               // if (attr.indexOf('disabled') >= 0) {
                  //  debugger;
               // }
                var attrV = evil("with(varObj){return " + ev.var + "}", 'varObj', ww.data, objName, dataObj); 
                if (attrV)  
                    ev.el.setAttribute(attr, attrV);
                else ev.el.removeAttribute(attr);
            }
            else if (ev.tp === 'for' && !bIgnoreFor) { 
                if ((ev.inVar === varName || (ev.mumFor && ev.inVar === ev.mumFor.forVar + '.' + varName)) && !ev.tmpFor) {
                    //if this is a template v-for block and match the for variable
                    var arr = dataObj[pn];
                    var forHtml = '';
                    ev.lastEl = ev.el;
                    for (var j = g_lstElVar.length - 1; j >= 0; j--) {//delete exist ev and element
                          var ev1 = g_lstElVar[j];
                        if ((ev1.inVar === varName || (ev1.mumFor && ev1.inVar === ev1.mumFor.forVar + '.' + varName)) && ev1.tmpFor && ev1.data == dataObj) {
                              if (ev1.el.parentNode) {
                                 ev1.el.parentNode.removeChild(ev1.el);
                              }
                              arrRemoveEv.push(j);
                          }
                    }

                    //ev.mumEl.innerHTML = "";  
                    for (var k in arr) {
                        var row = arr[k]; 
                        var m = ev.outerHTML;
                       
                       // m = m.fillVars(row, ev.forVar);
                       
                        m = createNode(m);
                        //ev.lastEl.after(m);
                        insertAfter(m, ev.lastEl);
                        bindElVars(m, row, g_lstElVar, ev);
                        ev.lastEl = m;
                       // observeArray(dataObj, arr, pn, row);
                        
                    }
                    observeArray(dataObj, arr, pn);
                    }
                   
                //ev.mumEl.innerHTML = forHtml;
            }
        }
        arrRemoveEv.forEach(function (v) {
            g_lstElVar.splice(v, 1);
        });
    } 
    function updateListByVar(dataObj,arrName, method, param,param2,param3) {
        var row;
        for (var i in g_lstElVar) {
            var ev = g_lstElVar[i];
            if (ev.tp === 'for' && !ev.tmpFor) {
                if (ev.inVar === arrName) {

                }
                else if (ev.mumFor && ev.inVar === ev.mumFor.forVar + '.' + arrName) {
                    if (ev.mumFor.data !== dataObj) {
                        continue;
                    }
                }
                else continue;
                var arr = dataObj[arrName];
                if ((method === 'push' || method === 'unshift' || method === 'insert') && !ev.tmpFor) {
                    row = param;
                    var m = ev.outerHTML;  
                    m = createNode(m); 
                    if (method === 'push') {
                        insertAfter(m, ev.lastEl);
                    }
                    else if (method === 'insert') {
                        insertAfter(m, param2);
                    }
                    else {
                        insertAfter(m, ev.el);
                    }
                    bindElVars(m, row, g_lstElVar, ev); 
                    ev.lastEl = m;
                    updateElByVar(dataObj, arrName, arr, true);//update other variable block refering to the size of the array.
                    observeArray(dataObj, arr, arrName, row);//observe this row
                } 
                else if (method == 'splice' || method == 'pop') {
                    if (!ev.tmpFor) { 
                        param2.forEach(function (node) {
                            for (var j = g_lstElVar.length - 1;j >= 0; j--) {
                                var c = g_lstElVar[j];
                                if (c.data === node || (c.forElVar && c.forElVar.mumFor && c.forElVar.mumFor.data===node)) { 
                                      g_lstElVar.splice(j, 1); 
                                } 
                                if (c.data === node) {
                                    if (c.tp === 'for' && c.tmpFor) { 
                                        $(c.el).animate({ height: '0px' }, {
                                            duration: 400, complete: function () { 
                                                if (this.parentNode) this.parentNode.removeChild(this);
                                               //if (c.el.parentNode) c.el.parentNode.removeChild(c.el);
                                            }
                                        }); 
                                    }
                                }
                            } 
                        });
                        updateElByVar(dataObj, arrName, arr, true);//update other variable block refering to the size of the array.
                    }
                }   
                else if (method === 'setValue') {
                    row = param; var oldRow = param2;
                    if (ev.tmpFor && oldRow === ev.data) {
                        var m = ev.outerHTML.replace(ev.forVar + '.', '');
                        m = fillVars(m,row); m = createNode(m);
                        ev.el.parentNode.replaceChild(m, ev.el);

                        for (var i = g_lstElVar.length - 1; i >= 0; i--) {
                            var j = g_lstElVar[i];
                            if (j.data === oldRow) {
                                g_lstElVar.splice(i, 1);
                            }
                        } 
                        if (!ev.el) {
                            var iii = 1;
                        }
                        bindElVars(ev.el, row, g_lstElVar, ev.tmpFor, ev);
                        observeArray(dataObj, arr, arrName, row); 
                    }
                }  
            }
        }
    } 
    if (ww.computed) {
        for (var cn in ww.computed) {
            var cf = ww.computed[cn];
            ww.data[cn] = cf();
        }
    }
    function observeObj(dataObj) {
        var arrRadio = []; 
        Object.keys(dataObj).forEach(function (pn) {
            var pv = dataObj[pn];
            if (typeof pv === "function") {
                return true;
            }
            var bNeedObserve = false; var bRadio = false;
            g_lstElVar.every(function (ev) { 
                if (ev.var && ev.var.indexOf(pn) >= 0) {
                    bNeedObserve = true; 
                } else if (ev.inVar && ev.inVar.indexOf(pn) >= 0) {
                    bNeedObserve = true;
                }
                else if (ev.innerHTML && ev.innerHTML.indexOf(pn) >= 0) {
                    bNeedObserve = true;
                }
                if (bNeedObserve && ev.el.type === 'radio' && ev.tp === 'model') {
                    bRadio = true;
                }
                if (bNeedObserve) return false;
                return true; 
            });
            if (!bNeedObserve) return true; 
            Object.defineProperty(dataObj, pn, {
                get: function () {
                    return pv;
                },
                set: function (nv) {
                    if (pv !== nv) {
                        pv = nv;
                        if (dataObj === ww.data) {
                            if (ww.watch && ww.watch[pn]) {
                                ww.watch[pn]();
                            }
                            if (ww.computed) {
                                for (var cn in ww.computed) {
                                    var cf = ww.computed[cn];
                                    var newV = cf.call(ww.data);
                                    if (newV !== ww.data[cn]) {
                                        ww.data[cn] = newV;//cf();
                                        updateElByVar(dataObj, cn, newV);
                                    } 
                                }
                            } 
                        }
                        if (Array.isArray(pv)) {
                            observeArray(dataObj,pv,pn);
                        }
                        //if (!ww.userInput)
                            updateElByVar(dataObj, pn, pv);
                    }
                }
            });
            
            if (Array.isArray(pv)) {
                observeArray(dataObj, pv, pn); 
            }
            if (bRadio) {
                arrRadio.push({ dataObj: dataObj, pn: pn, pv: pv });
            } else {
                updateElByVar(dataObj, pn, pv);
            }
        });
        arrRadio.forEach(function (rd) {
            updateElByVar(rd.dataObj, rd.pn, rd.pv);
        });
    }
     
    function observeArray(dataObj,array, arrName, observeRow) { 
        var arrForVar = [];
        for (var i in g_lstElVar) {
            var j = g_lstElVar[i];
            if (j.inVar === arrName || (j.mumFor && j.mumFor.forVar + '.' + arrName === j.inVar)) {
                arrForVar.push(j.inVar);
            }
        }
        if (arrForVar.length === 0) return; 
       //observe setting value by index in the array and change of the row property
        //example:rows[0]=row;  rows[0].name='jack';
        array.forEach(function (row, index) {
            var pv = array[index];
            if (observeRow && observeRow !== row) {
                return;
            }
            //observe setting value by index in the array.for example:rows[0]=row
            Object.defineProperty(array, index, {
                get: function () {
                    return pv;
                },
                set: function (newVal) { 
                    if (newVal !== pv) {
                        //var el = pv.el;
                        var oldVal = pv;
                        pv = newVal;
                        //pv.el = el;
                        updateListByVar(dataObj,arrName, 'setValue', pv, oldVal);
                    }
                }
            }); 
            observeObj(row); 
        });
        if (!observeRow) { 
            //observe the often used method call of array.  
            var originalProto = Array.prototype,
                overrideProto = Object.create(Array.prototype),
                result;

            var OAM = ['push', 'unshift','pop', 'splice'];//['push', 'pop', 'shift', 'unshift', 'short', 'reverse', 'splice']  
            OAM.forEach((method) => {
                Object.defineProperty(overrideProto, method, {
                    value: function () {  
                       
                        if (method === 'push') {
                            result = originalProto[method].apply(this, arguments);
                            updateListByVar(dataObj, arrName, method, arguments[0]);
                           
                        }
                        else if (method === 'unshift') {
                            result = originalProto[method].apply(this, arguments);
                            updateListByVar(dataObj, arrName, method, arguments[0]); 
                        }
                        else if (method === 'splice') {
                            var start = arguments[0], num = 1;
                            if (arguments.length === 2) {
                                num = arguments[1];
                            }
                            var removedNodes = new Array();
                            for (var j = start; j < start + num; j++) {
                                removedNodes.push(this[j]);
                            }
                            
                            var insertNode = null; var elInsertIndex = 0;
                            if (arguments.length >= 3) {
                                insertNode = arguments[2];

                                var startEl = this[start];
                                for (var j = g_lstElVar.length - 1; j >= 0; j--) {
                                    var c = g_lstElVar[j];
                                    if (c.data === startEl && c.tp === 'for' && c.tmpFor) {
                                        elInsertIndex = j;
                                        if (num == 0) elInsertIndex = j;
                                        break;
                                    }
                                }
                                result = originalProto[method].apply(this, arguments);
                                updateListByVar(dataObj, arrName, "insert", insertNode, g_lstElVar[elInsertIndex].el);
                            }
                            else {
                                result = originalProto[method].apply(this, arguments); 
                            }
                           
                            if (removedNodes)
                                updateListByVar(dataObj, arrName, method, null, removedNodes);
                           
                        }
                        else {
                            result = originalProto[method].apply(this, arguments);
                        }
                        return result;
                    }
                })
            }); 
            array.__proto__ = overrideProto;
        } 
    } 
    observeObj(ww.data);
}
