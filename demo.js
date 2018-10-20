window.curPage = "Demo";
window.me = window[curPage] = {  
    m_clientID:'', 
    m_couponToUse: '',
    m_couponAmount: 0,
    m_totalAmount: '',
    m_getAmount: 0, 
    m_rows: [
        { isChecked: false, coupon_id: '3', goods_name: 'cup', value: '30' },
        { isChecked: false, coupon_id: '4', goods_name: 'book', value: '40' }
    ],
    couponClicked: function () {
        var i;
        for (i in me.m_rows) {
            var r = me.m_rows[i];
            if (r.coupon_id === me.m_couponToUse) {
                me.m_couponAmount = r.value;
                r.isChecked = true;
            }
            else r.isChecked = false;
        }
    },  
    onPageLoad: function (page, options) { 
         me.WildWood = new WildWood({
            el: '#' + curPage,
            data: me,
            methods: me,
            watch: {
                m_couponAmount: function () {
                    if (parseFloat(me.m_couponAmount) > 0 && (me.m_totalAmount === '' || me.m_totalAmount < me.m_couponAmount)) {
                        me.m_totalAmount = me.m_couponAmount;
                    }
                },
            },
            computed: {
                getAmount: function () {
                    var gt = '';
                    gt = this.m_totalAmount - this.m_couponAmount;
                    if (isNaN(gt)) {
                        gt = '';
                    }
                    return gt;
                }
            }
        });  
     },   
     btnSell_clicked: function () {
        if (isNaN(me.m_totalAmount) || me.m_totalAmount.trim()==='') {
            bw.toast('请输入总额', 1000, 'center', true);
            return;
        }
        alert('Now you can send the data to server')
        var data = {
            client_id: me.m_clientID,
            used_coupon: me.m_couponToUse,
            total_amount: me.m_totalAmount,
            coupon_amount: me.m_couponAmount, 
         }; 
         /*
        $.ajax({
            url: '/Sell/Sell',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (data) { 
                if (data.result === 'OK') { 
                    me.m_bSold = true;
                    alert('Sale OK!'); 
                } 
            },
            timeout: 20000,
            complete: function (XMLHttpRequest, status) {
                if (status === 'timeout' || status === 'error') {//success  
                    alert('Timeout!');  
                } 
            }
         }); 
         */
    }, 
} 


 

