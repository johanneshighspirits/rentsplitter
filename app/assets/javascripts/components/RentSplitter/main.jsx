// Address namespace issue
window.RentSplitter = React.createClass({
  getInitialState: function(){
    return ({
      transfers: []
    });
  },
  componentDidMount: function() {
    $.get('/transfers.json', function(transfers){
      this.setState({
        transfers: transfers
      });
    }.bind(this), 'json');


    
    // getJSON('/transfers.json').then(function(transfers) {
    // console.warn(this);
    //   this.RentSplitter.setState({
    //     transfers: transfers
    //   })
    //   console.log(transfers);
    // }).catch(function(err) {
    //   console.error('RentSplitter.componentDidMount: ', err);
    // });
  },
  render: function() {
    var transfers = [];
    this.state.transfers.forEach(function(t, i) {
      transfers.push(
        <li key={i}><b>{t.message}</b> <i>{t.amount}</i></li>
      )
    })
    return (
      <div>
        <p>RentSplitter <i>&mdash; react-js</i></p>
        <ul>
          {transfers}
        </ul>
      </div>
    )
  }
})

