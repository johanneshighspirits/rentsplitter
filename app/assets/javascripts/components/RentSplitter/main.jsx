
// Address namespace issue
window.RentSplitter = React.createClass({
  getInitialState: function(){
    return ({
      members: []
    });
  },
  componentDidMount: function() {
    $.get('/projects/' + this.props.projectId + '/transfers.json', function(members){
      this.setState({
        members: members
      });
    }.bind(this), 'json');
  },
  render: function() {
    var today = new Date();
    var thisMonth = today.getMonthName();
    var members = this.state.members.map(function(member, m) {
      return (
        <MemberInfo
          key={m}
          member={member}
          thisMonth={thisMonth}
          totalRentToPay={10000}
        />
      )
    });
    return (
      <section>
        <article>
          <h2>RentSplitter <i>&mdash; react-js</i></h2>
          <p>main info here</p>
        </article>
        <article>
          <ul>
            {members}
          </ul>
        </article>
      </section>
    )
  }
});

var MemberInfo = React.createClass({
  render: function() {
    var isMember = this.props.member.isMember;
    // The total amount to pay
    // ((rent - support) / nr of members)
    var amountToPay = this.props.totalRentToPay;
    var transfers = this.props.member.transfers.map(function(transfer, t){
      if (transfer.amount == null) {
        transfer.amount = 0;
      }
      amountToPay -= parseInt(transfer.amount);
      return (
        <tr key={t} className={transfer.isNotViewedYet ? "newTransaction" : null}>
          <td width="33%" className="lined shortDate">{transfer.shortDate}</td>
          <td width="33%" className="lined longDate">{transfer.longDate}</td>
          <td width="50%" className="lined"><i>{transfer.message}</i></td>
          <td width="17%" className="lined right">{transfer.amount}:-</td>
        </tr>
      )
    });
    return (
      <div className={isMember ? "memberInfo noLongerMember" : "memberInfo"}>
        <h3>{this.props.member.name}</h3>
        {!isMember ? <p className="noLongerMember">{this.props.member.name} är inte medlem i<br/>Årsta Frukt & Musik AB längre.<br/>{amountToPay > 0 ? "KVARSTÅENDE SKULD: " + (amountToPay * -1) + ":-" : "Alla skulder betalda."}</p> : null }
        {amountToPay > 0 ?
        <span className="red" style={{background: "#d05959", color: "#FFF"}}>Att betala senast sista {this.props.thisMonth}:
          <span className="displayNumbers right">{amountToPay}:-</span>
        </span>
          :
        <span className="green" style={{background: "#499260", color: "#FFF"}}>Till godo:
          <span className="displayNumbers right">{amountToPay * -1}:-</span>
        </span>
        }
        <table>
          <thead>
            <tr>
              <th colSpan="3" style={{paddingBottom: "0.7em", fontSize: "1.2em"}}>Tidigare inbetalningar</th>
            </tr>
            <tr>
              <th>Datum</th>
              <th>Meddelande</th>
              <th>Belopp</th>
            </tr>
          </thead>
          <tbody>
            {transfers}
          </tbody>
        </table>
      </div>
    )
  }
});

