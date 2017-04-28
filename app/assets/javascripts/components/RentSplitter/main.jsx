// Address namespace issue
window.RentSplitter = React.createClass({
  getInitialState: function(){
    return ({
      transactions: []
    });
  },
  componentDidMount: function() {
    $.get('/transactions.json', function(transactions){
      this.setState({
        transactions: transactions
      });
    }.bind(this), 'json');


    
    // getJSON('/transactions.json').then(function(transactions) {
    // console.warn(this);
    //   this.RentSplitter.setState({
    //     transactions: transactions
    //   })
    //   console.log(transactions);
    // }).catch(function(err) {
    //   console.error('RentSplitter.componentDidMount: ', err);
    // });
  },
  render: function() {
    var transactions = [];
    this.state.transactions.forEach(function(t, i) {
      transactions.push(
        <li key={i}><b>{t.message}</b> <i>{t.amount}</i></li>
      )
    })
    return (
      <div>
        <p>RentSplitter <i>&mdash; react-js</i></p>
        <ul>
          {transactions}
        </ul>
      </div>
    )
  }
})

