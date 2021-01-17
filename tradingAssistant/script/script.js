app = new Vue({
    el: '#root',
    data: { alpha: null, load: true, stock: null, status: null, chartx: null, charty: null, attribute: '1. open', quote: null, time: null, daily: null, collection : null, pred: null, symbol: 'AnalystTargetPrice', animate: null},
    mounted: function () {
        this.load = false
        this.alpha = alphavantage({ key: 'TEST_KEY' })
    },
    methods: {
        sync: async function (event) {
            this.load = true
            // let prediction = await fetch('http://127.0.0.1:5000')
            // this.collection = await prediction.json()
            // this.pred = this.collection[(event.target.symbol.value).toUpperCase()][2]
            this.stock = await this.alpha.fundamental.company_overview(event.target.symbol.value)
            this.quote = await this.alpha.data.quote(event.target.symbol.value)
            this.quote = this.quote["Global Quote"]
            const res = await this.alpha.technical.rsi(event.target.symbol.value, '1min', 14, 'close')
            this.stock.RSI = Object.entries(res['Technical Analysis: RSI']).slice(-1)[0][1].RSI
            this.daily = await this.alpha.data.daily(event.target.symbol.value, 'compact', 'json')
            
            this.pred = this.stock[this.symbol]
            await this.getStatus() 
            this.load = false
            await this.plotchart() 
            this.animate  = true                    
            event.target.symbol.value = null
        },
        plotchart: function (e) {
            if (e) this.attribute = e.currentTarget.id;
            var ctx = document.getElementById('myChart').getContext('2d'),
                      open_gradient = ctx.createLinearGradient(0, 0, 0, 300),
                      close_gradient = ctx.createLinearGradient(0, 0, 0, 300);

            close_gradient.addColorStop(0, 'rgba(96, 193, 131, 0.5)');
            close_gradient.addColorStop(0.5, 'rgba(96, 193, 131, 0.25)');
            close_gradient.addColorStop(1, 'rgba(96, 193, 131, 0)');
            var close_color = 'rgba(96, 193, 131, 1)', open_color = 'rgba(243, 106, 135, 1)';
                      
            open_gradient.addColorStop(0, 'rgba(243, 106, 135, 0.5)');
            open_gradient.addColorStop(0.5, 'rgba(243, 106, 135, 0.25)');
            open_gradient.addColorStop(1, 'rgba(243, 106, 135, 0)');

            var gradient = this.attribute == '1. open' ? open_gradient : close_gradient;
            var color = this.attribute == '1. open' ? open_color : close_color;
            var label_data = this.attribute == '1. open' ? 'Opening' : 'Closing';

            const plot = this.daily["Time Series (Daily)"]
            const tempx = Object.keys(plot).reverse()
            this.charty = []
            this.chartx = []
            const tempy = Object.values(plot).reverse()
            for (var key of tempy) {
                this.charty.push(key[this.attribute])
            }
            for (var key of tempx) {
                this.chartx.push(key.substring(8,10) + '-' + key.substring(5, 7) + '-' + key.substring(2,4))
            }

            var myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.chartx,
                    datasets: [{
                        label:  label_data + ' values of last 100 days',
                        data: this.charty,
                        backgroundColor: gradient,
                        borderColor: color,
                        pointRadius: 1,
                        lineTension: 0,
                        borderWidth: 2
                    }],

                },
                options: {
                    maintainAspectRatio: false,
                    bezierCurve: false,
                    scales: {
                        xAxes: [{
                            ticks: {
                                maxTicksLimit: 9,
                                autoSkip: true,

                            }
                        }],
                        yAxes: [{
                            ticks: {
                            }
                        }]
                    }
                }
            });
        },
        getStatus: async function () {
            var today = new Date();
            const month = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            const year = today.getFullYear();
            const hh = today.getHours();
            const dd = today.getDate();
            const min = today.getMinutes();

            const cal_res = await fetch(`https://api.tradier.com/v1/markets/calendar?month=${month}&year=${year}`, { headers: { Accept: 'application/json' } })
            const data = await cal_res.json();
            const e = data.calendar.days.day;

            this.time = today.toLocaleTimeString('en-us', { timeZone: 'America/Chicago' });
            console.log(e[dd-1].status);

            if (e[dd - 1].status === "open"
                && (hh >= 20 || (hh >= 0 && (hh <= 2 && min <= 30))))
                this.status = "open";
            else
                this.status = "closed";
        }
    }
})


