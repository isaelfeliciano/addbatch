const lS = localStorage;
var addbatchServerURL = lS.getItem('serverAddress');

var app = new Vue({
	el: '#app',
	data: {
		batchesData: [],
		loading: false,
		disableSaveButton: true,
		value2: new Date(2016, 9, 10, 18, 40)
	},
	created() {
		nw.Window.get().maximize();
		this.fetchData();
	},
	methods: {
		fetchData: function() {
			this.loading = true
			axios.get(addbatchServerURL + 'getBatchesInfo').then( response => {
				this.batchesData = response.data.data;
				this.loading = false;
			})
		},
		handleSave: function(index, row, setCurrent) {
			let self = this
			row.loading = false
			const dataJson = this.batchesData[index];
			row.loading = true
			console.log(dataJson)
			axios.post(addbatchServerURL + 'saveBatchAndPrint', dataJson).then( response => {
				if(response.data.msg === 'error-saving') {
					self.batchesData[index]['loading'] = false;
					self.$refs.singleTable.setCurrentRow(null);
					return console.log('Error saving Batch')
				}
				setTimeout(() => {
					row.loading = false;
					row.disableSaveButton = false; // Set to false to make it look as true on the view
					self.$refs.singleTable.setCurrentRow(null);
				}, 500)
			})
		},
		handleCurrentChange(val) {
			// this.$refs.singleTable.setCurrentRow(null);
		},
		handleInputChange(row) {
			row.disableSaveButton = true; // Set to true to make it look as false on the view
			this.$refs.singleTable.setCurrentRow(null);
		}
	}
})
