// Address namespace issue
window.RentSplitter = React.createClass({
  componentDidMount: function() {
    getJSON('/transactions.json').then(function(transactions) {

      console.log(transactions);
    }).catch(function(err) {
      console.error('RentSplitter.componentDidMount: ', err);
    });
  },
  render: function() {
    return (
      <div>
        <p>RentSplitter <i>&mdash; react-js</i></p>
      </div>
    )
  }
})

