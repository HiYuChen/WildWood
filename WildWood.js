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
        if (parent.lastChild == targetEle) {   
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
    String.prototype.fillVars = function (dataObj, objName) { 
        var n = 0,n1=0,n_pre=0; var arrVars = [];
        var res = '';
        while (n >= 0 && n1 >= 0 && n_pre <= this.length - 1) {
            n = this.indexOf('{{', n_pre);
            if (n >= 0) {
                res += this.substring(n_pre, n);
                n1 = this.indexOf('}}', n + 1);
                if (n1 > n) {
                    var vn = this.substring(n + 2, n1);
                    var vv = evil("with(varObj){return " + vn + "}", 'varObj', ww.data, objName, dataObj);
                    res += vv; 
                    n_pre = n1+2;
                } 
            } else {
                res += this.substring(n_pre, this.length); 
            } 
        } 
        return res;
    }
    function createNode(htmlStr) {
        var div = document.createElement("div");
        div.innerHTML = htmlStr;
        return div.childNodes[0];
    }
    function evil(code,argName1,argValue1,argName2,argValue2) {
        var fn = Function;
        return new fn(argName1, argName2, code)(argValue1, argValue2);
    }
    ww.el = document.querySelector(ww.el);
    var g_lstElVar = new Array();
    var forElVar = null;
    //bind elements to wildwood 
    function bindElVars(el, data, lstElVar, tmpFor) { 
        if (tmpFor) {
            forElVar = tmpFor.mumFor;
        }
        var bCurrentIsFor = false;
        if (el.getAttribute) {
            var v = el.getAttribute('v-for');
            if (v) {
                var arr = v.split(' in ');
                if (arr.length === 2) {
                    bInFor = true; bCurrentIsFor = true;
                    forElVar = { tp: 'for', el: el, forVar: arr[0], inVar: arr[1], outerHTML: el.outerHTML, mumFor: forElVar, tmpFor: tmpFor,lastEl:el};
                    if (!tmpFor) el.style.display = "none";
                    forElVar.data = data;
                    lstElVar.push(forElVar);
                }
            }
            var elvar = null;
            v = el.getAttribute('v-if');
            if (v) {
                elvar = { tp: 'if', el: el, var: v, forElVar: forElVar, data: data, origDisplay: el.style.display};
                lstElVar.push(elvar);
            }
            v = el.getAttribute('v-bind:value');
            if (v) {
                elvar = { tp: 'bind:value', el: el, var: v, forElVar: forElVar, data: data };
                lstElVar.push(elvar);
            }
            v = el.getAttribute('v-bind:style');
            if (v) {
                elvar = { tp: 'bind:style', el: el, var: v, forElVar: forElVar,data: data};
                lstElVar.push(elvar);
            }
            v = el.getAttribute('v-bind:class');
            if (v) {
                elvar = { tp: 'bind:class', el: el, var: v, forElVar: forElVar,data: data};
                lstElVar.push(elvar);
            } 
            v = el.getAttribute('v-model');
            var inputType = el.getAttribute('type');
            var modelVar = null;
            if (v) { 
                modelVar = v; 
                elvar = { tp: 'model', el: el, var: v, forElVar: forElVar, data: data }; 
                lstElVar.push(elvar);
            }
            v = el.getAttribute('v-on:change');
            var md = null;
            if (v) {
                var vv = v.split('(');
                vv = vv[0];
                if (ww.methods && ww.methods[vv])
                   md = ww.methods[vv];
                
                elvar = { tp: 'on:change', el: el, var: v, forElVar: forElVar, data: data }
                lstElVar.push(elvar);
            } 
            if (modelVar || md) {
                el.onchange = function (evt) {
                    //evil(); 
                    if (modelVar) {
                        if (modelVar.indexOf('.') === -1) {
                            ww.data[modelVar] = el.value;
                        }
                        else {
                            modelVar = modelVar.split('.')[1];
                            data[modelVar] = el.value;
                        }
                    }
                    if (md) {
                        md(data);
                    }
                }; 
            }
            
        }
       // if (el.innerText && el.innerHTML.indexOf('<') === -1 && el.innerText.indexOf('{{') >= 0) {
           // debugger;
       // }
        if (!el.children || el.children.length === 0) {
            if (!el.children) {
                var iiii = 1;
            }
            if (el.innerText && el.innerHTML.indexOf('<')===-1 && el.innerText.indexOf('{{') >= 0) {
                lstElVar.push({ tp: 'innerText', el: el, innerText: el.innerText, forElVar: forElVar,data:data });
            }
        }
        else {
            for (var i = 0; i < el.children.length;i++) {
                if (!el.children[i].innerText) {
                  //  debugger;
                }
                bindElVars(el.children[i], data, g_lstElVar, null);
            } 
        } 
        if (bCurrentIsFor) {
            forElVar = forElVar.mumFor;
        }
    }
    bindElVars(ww.el,ww.data, g_lstElVar,null);

    function updateElByVar(dataObj, pn, pv) { 
        for (var i in g_lstElVar) {
            var ev = g_lstElVar[i]; 

            var objName = '';
            var varName = pn;  
            if (dataObj !== ww.data) {
                if(ev.data !== dataObj )  
                    continue;
                if (ev.forElVar) {
                    objName = ev.forElVar.forVar;
                    if (ev.var && ev.var.indexOf('.') === -1) {
                        //using global var

                    }
                } 
             }  
            if (objName) 
                varName = objName + '.' + varName;
            if (ev.tp === 'model' && ev.var === varName) {
                if (ev.el.type === 'radio') {
                    if (ev.el.value === pv) {
                        ev.el.checked = true;
                    } 
                }
                else ev.el.value = pv;
            }
            else if (ev.tp === 'bind:value' && ev.var === varName) {
                  ev.el.value = pv;
            }
            else if (ev.tp === 'innerText' && ev.innerText.indexOf(varName) >= 0) { 
                ev.el.innerText =  ev.innerText.fillVars(dataObj, objName);
            }
            else if (ev.tp === 'if' && ev.var.indexOf(varName)>=0) {
                var bShow = evil("with(varObj){return " + ev.var + "}", 'varObj', ww.data, objName, dataObj); 
                if (bShow) ev.el.style.display = ev.origDisplay;
                else ev.el.style.display = "none";
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
                if (ev.var.indexOf('{') >= 0) {
                    obj = JSON.parse(ev.var);
                }
                else if (ev.var === pn) {
                    obj = pv;
                }
                for (var n in obj) {
                    var v = obj[n];
                    var vv = evil("with(varObj){return " + v + "}", 'varObj', ww.data, objName, dataObj);
                    if (vv) {
                        if (!ev.el.classList.contains(n)) {
                            ev.el.classList.add(n);
                        }
                    }
                    else if (ev.el.classList.contains(n)) {
                        ev.el.className.remove(n);
                    }
                }
            }
            else if (ev.tp === 'for') { 
                if (ev.inVar === varName && !ev.tmpFor) {
                    var arr = dataObj[pn];
                    var forHtml = '';
                    //ev.mumEl.innerHTML = "";  
                    for (var k in arr) {
                        var row = arr[k]; 
                        var m = ev.outerHTML;
                        m = m.fillVars(row, ev.forVar);
                        m = m.fillVars(ww.data);
                        
                        m = createNode(m);
                        //ev.lastEl.after(m);
                        insertAfter(m, ev.lastEl);

                        bindElVars(m, row, g_lstElVar, ev);
                        ev.lastEl = m;
                        observeArray(dataObj, arr, pn, row);
                    }
                }
                //ev.mumEl.innerHTML = forHtml;
            }
        }
    } 
    function updateListByVar(dataObj,arrName, method, param,param2) {
        var row;
        for (var i in g_lstElVar) {
            var ev = g_lstElVar[i];
            if (ev.tp === 'for' && ev.inVar === arrName) {
                var arr = dataObj[arrName];
                if (method === 'push' && !ev.tmpFor) {
                    row = param;
                    var m = ev.outerHTML.replace(ev.forVar + '.', '');
                    m = m.fillVars(row);
                    m = createNode(m);
                  
                    //ev.lastEl.after(m);
                    insertAfter(m, ev.lastEl);
                    bindElVars(m, row, g_lstElVar, ev);
                    ev.lastEl = m;  
                    observeArray(dataObj, arr, arrName, row);
                }
                else if (method == 'slice' || method == 'pop') {
                    if (!ev.tmpFor) {
                        param.forEach(function (node) {
                            ev.el.parentNode.removeChild(node.el);
                        });
                    }
                }   
                else if (method === 'setValue') {
                    row = param; var oldRow = param2;
                    if (ev.tmpFor && oldRow === ev.data) {
                        var m = ev.outerHTML.replace(ev.forVar + '.', '');
                        m = m.fillVars(row); m = createNode(m);
                        ev.el.parentNode.replaceChild(m, ev.el);

                        for (var i = g_lstElVar.length - 1; i >= 0; i--) {
                            var j = g_lstElVar[i];
                            if (j.data === oldRow) {
                                g_lstElVar.splice(i, 1);
                            }
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
                else if (ev.innerText && ev.innerText.indexOf(pn) >= 0) {
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
            if (j.inVar === arrName) {
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

            var OAM = ['push', 'pop', 'splice'];//['push', 'pop', 'shift', 'unshift', 'short', 'reverse', 'splice']  
            OAM.forEach((method) => {
                Object.defineProperty(overrideProto, method, {
                    value: function () {  
                        if (method === 'push') {
                            updateListByVar(dataObj,arrName, method, arguments[0]);
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
                            updateListByVar(dataObj,arrName, method, null, removedNodes);
                        }
                        result = originalProto[method].apply(this, arguments);
                        return result;
                    }
                })
            }); 
            array.__proto__ = overrideProto;
        } 
    } 
    observeObj(ww.data);
}
