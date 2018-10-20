someone may ask: so many successful products is there, vue and angular is perfect. why make this one?
# it is simple, it is smaller, and it is faster. So it is here.
Other similar component usually replace the whole dom object when loading. So they will remove the event handlers and user defined variables on doms. So they may have problems with some UI components. The templete synax is almost same as vue.

Following is a simple demo for sale. It calculate the cash amount by total amount and coupon amount

for exmaple. The data defined is 
 var WildWood = new WildWood({
  el: '#app',
  data{ 
     name:'john',
 	 score:100,
	 gender:'man',
	 html:'<div>hello</div>',
	 subjects:[
	 	 {name:'english',teacher:'jack'},
		 {name:'math',teacher:'tom'}, 
	 ],
	 },
     methods:{
	 	 scoreChanged:function(){
		 
		 }
	 },
    watch:{
	     
	 },
    computed:{
	 
	 }
 }
 In html, you can use following syntax
{{name}}   -- should be used inside a html element which has no children
v-html="html"   ---innerHTML will be replaced
v-model="score"   
v-bind:value="score"  
v-bind:style="{background-color:gender=='man'? '#0f0':'#00f'"  
v-bind:class="{classA:gender=='man',classB:gender=='woman'}"  
v-if="gender=='man'"  
v-for="for subject in subjects" 
v-on:change="scoreChanged()"  

# html:
 ```html
              <div> 
                     <div style="display:flex;">
                            <div>Total:</div>
							<div >
							  <input type="text"  v-model="totalAmount" placeholder="Please input" > 
							</div> 
                       </div>
                       <div style="display:flex;">
                            <div>Coupon:</div>
							<div >
							 <label>{{couponAmount}} </label>  
							</div> 
                       </div>
					   <div style="display:flex;">
                            <div>Coupon:</div>
							<div >
							 <label>{{cashAmount}} </label>  
							</div> 
                       </div> 
               </div>
    
            
              <div style="margin-top:10px;margin-left:10px;">Please select a coupon</div> 
              <div>Selected coupon id is: {{m_couponToUse}}</div>

              <div> 
                  <ul>
                       <li v-for="row in m_coupons" > 
					       <div style="display:flex">
                                <input type="radio" name="radio_coupon" style="" v-on:change ="couponClicked();" v-bind:value="row.coupon_id" v-model="m_couponToUse" /> 
                                <img  v-bind:style="{visibility:row.isChecked?'visible':'hidden'}" style="width:32px;height:32px;" src="check.svg"/> 
                                  <div>
                                      {{row.value}}元
                                  </div>
                                  <div></div>
                                  <div class="item-title">{{row.goods_name}}</div>
						  </div> 
                       </li>
                  </ul>
			</div>
```

# js code:

```javascript
 var WildWood = new WildWood({
            el: '#app',
            data: { 
				couponToUse: '',
				couponAmount: 0,
				totalAmount: '',
				cashAmount: 0, 
			    m_coupons:[ { isChecked: false, coupon_id: '3', goods_name: 'cup', value: '30' },
				{ isChecked: false, coupon_id: '4', goods_name: 'book', value: '40' }
				],
			  oper:'jack'
			},
            methods: {
			  couponClicked: function () {
				var i;
				for (i in this.m_rows) {
					var r = me.m_rows[i];
					if (r.coupon_id === me.m_couponToUse) {
						me.m_couponAmount = r.value;
						r.isChecked = true;
					}
					else r.isChecked = false;
				}
			  },
		
			},
            watch: {
                couponAmount: function () {
                    if (parseFloat(this.couponAmount) > 0 && (this.totalAmount === '' || this.m_totalAmount < this.m_couponAmount)) {
                        this.m_totalAmount = this.m_couponAmount;
                    }
                },
            },
            computed: {
                cashAmount: function () { 
                    return this.totalAmount - this.couponAmount; 
                }
            }
        });  
```
	 
	For complete demo, please look at the demo html file
