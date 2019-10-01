import Web3 from "web3";
import GrowdropManagerArtifact from "../../build/contracts/GrowdropManager.json";
import GrowdropArtifact from "../../build/contracts/Growdrop.json";
import EIP20Interface from "../../build/contracts/EIP20Interface.json";
import SimpleTokenABI from "./SimpleTokenABI.json";
import UniswapExchangeInterfaceABI from "./UniswapExchangeInterfaceABI.json";

const App = {
  web3: null,
  account: null,
  DAI: null,
  Growdrop: null,
  SimpleToken: null,
  GrowdropManager: null,
  UniswapDAIExchange: null,
  UniswapSimpleTokenExchangeAddress: "0x0c32A8C03e96347BaB0D4caA8F936818E71A0faB",

  withDecimal: function(number) {
    return String(Number(number)/Number("1000000000000000000"));
  },

  /*
  new contract instance
  abi => contract abi (json type)
  address => contract address (String)
  */
  contractInit: function(abi, address) {
    const { web3 } = App;
    return new web3.eth.Contract(abi, address);
  },

  /*
  get metamask current account (address)
  */
  getMetamaskCurrentAccount: async function () {
    const { web3 } = App;
    const accounts = await web3.eth.getAccounts();
    return accounts[0];
  },

  GetBalanceCall: async function (account) {
    const { web3 } = App;
    return await web3.eth.getBalance(account);
  },

  start: async function() {
    const { web3 } = this;
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = GrowdropManagerArtifact.networks[networkId];

    this.GrowdropManager = this.contractInit(GrowdropManagerArtifact.abi, deployedNetwork.address);
    this.DAI = this.contractInit(EIP20Interface.abi, "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa");
    this.UniswapDAIExchange = this.contractInit(UniswapExchangeInterfaceABI.abi, "0xaf51baaa766b65e8b3ee0c2c33186325ed01ebd5");

    this.account = await this.getMetamaskCurrentAccount();
    await this.refreshFirst();
  },

  refreshFirst: async function() {
    this.SimpleToken = this.contractInit(SimpleTokenABI.abi, "0x1c73c83cbf5c39459292e7be82922d69f9d677e6");
    await this.refreshGrowdrop();

    if(App.Growdrop!=null) {
      await this.refresh();
    }
    this.bindEvents();
  },

  /*
  Uniswap token to eth price call
  contractinstance => Uniswap Exchange contract instance 
  amount => amount of token to get eth price (Number)
  */
  UniswapTokenToEthInputPriceCall: async function(contractinstance, amount) {
    return await contractinstance.methods.getTokenToEthInputPrice(amount).call();
  },

  /*
  ERC20 Token's balance call
  contractinstance => ERC20 contract instance 
  account => address to get balance of (String)
  */
  TokenBalanceOfCall: async function(contractinstance, account) {
    return await contractinstance.methods.balanceOf(account).call();
  },

  /*
  ERC20 Token's allowance call (approved amount)
  contractinstance => ERC20 contract instance
  from => address who approved (String)
  to => address from approved to (String)
  */
  TokenAllowanceCall: async function(contractinstance, from, to) {
    return await contractinstance.methods.allowance(from, to).call();
  },

  /*
  Growdrop Contract Data call
  contractinstance => Growdrop contract instance
  */
  GetGrowdropDataCall: async function(contractinstance) {
    return await contractinstance.methods.getGrowdropData().call();
  },

  /*
  Growdrop Contract's User Data call
  contractinstance => Growdrop contract instance
  account => account to get User Data (String)
  */
  GetUserDataCall: async function(contractinstance, account) {
    return await contractinstance.methods.getUserData().call({from: account});
  },

  /*
  Growdrop Contract List's Length call
  contractinstance => GrowdropManager contract instance
  */
  GetGrowdropListLengthCall: async function(contractinstance) {
    return await contractinstance.methods.getGrowdropListLength().call();
  },

  /*
  Growdrop Contract address call
  contractinstance => GrowdropManager contract instance
  contractIdx => Growdrop contract index (Number)
  */
  GetGrowdropCall: async function(contractinstance, contractIdx) {
    return await contractinstance.methods.getGrowdrop(contractIdx).call();
  },

  /*
  address's invested amount + accrued interest call
  contractinstance => Growdrop contract instance
  account => address to get data (String)
  */
  TotalPerAddressCall: async function(contractinstance, account) {
    return await contractinstance.methods.TotalPerAddress(account).call();
  },

  /*
  address's invested amount call
  contractinstance => Growdrop contract instance
  account => address to get data (String)
  */
  InvestAmountPerAddressCall: async function(contractinstance, account) {
    return await contractinstance.methods.InvestAmountPerAddress(account).call();
  },

  /*
  address's total invested amount call (all Growdrop contracts)
  contractinstance => GrowdropManager contract instance
  account => address to get data (String)
  */
  TotalUserInvestedAmountCall: async function(contractinstance, account) {
    return await contractinstance.methods.TotalUserInvestedAmount(account).call();
  },

  /*
  Growdrop contract's total user count call
  contractinstance => GrowdropManager contract instance
  account => Growdrop contract address to get data (String)
  */
  TotalUserCountCall: async function(contractinstance, account) {
    return await contractinstance.methods.TotalUserCount(account).call();
  },

  /*
  Growdrop contract's total invested amount call
  contractinstance => Growdrop contract instance
  */
  TotalMintedAmountCall: async function(contractinstance) {
    return await contractinstance.methods.TotalMintedAmount().call();
  },

  /*
  Growdrop contract's selling token contract address call
  contractinstance => Growdrop contract instance
  */
  GrowdropTokenCall: async function(contractinstance) {
    return await contractinstance.methods.GrowdropToken().call();
  },

  /*
  Growdrop contract's end time call
  contractinstance => Growdrop contract instance
  */
  GrowdropEndTimeCall: async function(contractinstance) {
    return await contractinstance.methods.GrowdropEndTime().call();
  },

  /*
  Growdrop contract's beneficiary call
  contractinstance => Growdrop contract instance
  */
  BeneficiaryCall: async function(contractinstance) {
    return await contractinstance.methods.Beneficiary().call();
  },

  /*
  ERC20 token approve transaction
  contractinstance => ERC20 token contract instance
  to => address to approve (String)
  amount => amount to approve (Number)
  account => address approve to "to" address (String) 
  */
  TokenApproveTx: async function(contractinstance, to, amount, account) {
    return await contractinstance.methods.approve(to, amount).send({from:account}); 
  },

  /*
  make new Growdrop Contract transaction (only owner can)
  contractinstance => GrowdropManager contract instance
  tokenaddress => dai contract address (set, String)
  ctokenaddress => compound cdai contract address (set, String)
  growdroptokenaddress => selling token address (String)
  beneficiaryaddress => beneficiary address (String)
  growdroptokenamount => selling token amount (Number)
  GrowdropApproximateStartTime => Growdrop contract's approximate start time (not important only to show, Number)
  GrowdropPeriod => Growdrop contract's selling period (Number)
  ToUniswapGrowdropTokenAmount => selling token amount to add Uniswap (Number) 
  ToUniswapInterestRate => beneficiary's interest percentage to add Uniswap (1~99, Number)
  UniswapFactoryAddr => Uniswap Factory contract address (set, String)
  UniswapExchangeAddr => Uniswap Dai Exchange contract address (set, String)
  account => address calling (owner, String)
  */
  NewGrowdropTx: async function(
    contractinstance, 
    tokenaddress, 
    ctokenaddress, 
    growdroptokenaddress, 
    beneficiaryaddress, 
    growdroptokenamount, 
    GrowdropApproximateStartTime,
    GrowdropPeriod,
    ToUniswapGrowdropTokenAmount,
    ToUniswapInterestRate,
    UniswapFactoryAddr,
    UniswapExchangeAddr,
    account) {
      return await contractinstance.methods.newGrowdrop(
        tokenaddress,
        ctokenaddress,
        growdroptokenaddress,
        beneficiaryaddress,
        growdroptokenamount,
        GrowdropApproximateStartTime,
        GrowdropPeriod,
        ToUniswapGrowdropTokenAmount,
        ToUniswapInterestRate,
        UniswapFactoryAddr,
        UniswapExchangeAddr
      ).send({from:account});
  },

  /*
  Start Growdrop Contract transaction (only beneficiary can)
  contractinstance => Growdrop contract instance
  account => address calling (beneficiary, String)
  */
  StartGrowdropTx: async function(contractinstance, account) {
    return await contractinstance.methods.StartGrowdrop().send({from:account});
  },

  /*
  add investing amount
  contractinstance => Growdrop contract instance
  amount => amount to add investing (Number)
  account => address adding (String)
  */
  MintTx: async function(contractinstance, amount, account) {
    return await contractinstance.methods.Mint(amount).send({from:account});
  },

  /*
  subtract investing amount
  contractinstance => Growdrop contract instance
  amount => amount to subtract investing (Number)
  account => address subtracting (String)
  */
  RedeemTx: async function(contractinstance, amount, account) {
    return await contractinstance.methods.Redeem(amount).send({from:account});
  },

  /*
  Withdraw interest (beneficiary)
  Withdraw invested amount and get selling token (investor)
  contractinstance => Growdrop contract instance
  ToUniswap => true : add to uniswap, false : not add to uniswap (only for beneficiary, investor doesn't care, Boolean)
  account => address calling (String)
  */
  WithdrawTx: async function(contractinstance, ToUniswap, account) {
    return await contractinstance.methods.Withdraw(ToUniswap).send({from:account});
  },

  setElement_innerHTML: async function(element, text) {
    element.innerHTML = App.withDecimal(text);
  },

  setInvestorMintedResult: async function(events) {
    let InvestorMintedtemplaterow = $('#Growdrop_InvestorMintedevent_row');
    InvestorMintedtemplaterow.empty();
    let InvestorMintedtemplate = $('#Growdrop_InvestorMintedevent_template');
    for(let i = 0; i<events.length; i++) {
      if(parseInt(events[i].returnValues._ActionIdx)==0) {
        InvestorMintedtemplate.find('.InvestorMintedTimedisplay').text(new Date(parseInt(events[i].returnValues._ActionTime*1000)));
        InvestorMintedtemplate.find('.InvestorMintedAmountdisplay').text(App.withDecimal(events[i].returnValues._Amount));
      
        InvestorMintedtemplaterow.append(InvestorMintedtemplate.html());
      }
    }
  },

  setInvestorRedeemedResult: async function(events) {
    let InvestorRedeemedtemplaterow = $('#Growdrop_InvestorRedeemedevent_row');
    InvestorRedeemedtemplaterow.empty();
    let InvestorRedeemedtemplate = $('#Growdrop_InvestorRedeemedevent_template');
    for(let i = 0; i<events.length; i++) {
      if(parseInt(events[i].returnValues._ActionIdx)==1) {
        InvestorRedeemedtemplate.find('.InvestorRedeemedTimedisplay').text(new Date(parseInt(events[i].returnValues._ActionTime*1000)));
        InvestorRedeemedtemplate.find('.InvestorRedeemedAmountdisplay').text(App.withDecimal(events[i].returnValues._Amount));
        
        InvestorRedeemedtemplaterow.append(InvestorRedeemedtemplate.html());
      }
    }
  },

  getUserActionPastEvents: async function(contractinstance, GrowdropAddress, Account) {
    /*
    filter : 
    _eventIdx, => event number (Number)
    _Growdrop, => growdrop contract address (String)
    _From => account address (String)
    */
    contractinstance.getPastEvents("UserAction", {filter: {_Growdrop: GrowdropAddress, _From:Account},fromBlock: 0,toBlock: 'latest'}).then(function(events) {
      /*
      events[i].returnValues._eventIdx, (Number)
      events[i].returnValues._Growdrop, (String)
      events[i].returnValues._From, (String)
      events[i].returnValues._Amount, => 0 : Mint Amount, 1 : Redeem Amount, 2 : nothing(0), 3 : Growdrop Token Amount, 4 : nothing(0) (Number)
      events[i].returnValues._ActionTime, (Number unix timestamp)
      events[i].returnValues._ActionIdx, => 0 : Mint, 1 : Redeem, 2 : BeneficiaryWithdraw, 3 : InvestorWithdraw, 4 : UserJoinedGrowdrop (Number)
      */
      App.setInvestorMintedResult(events);
      App.setInvestorRedeemedResult(events);
    });
  },

  getGrowdropActionPastEvents: async function(contractinstance, GrowdropAddress) {
    /*
    filter : 
    _eventIdx, => event number (Number)
    _Growdrop, => growdrop contract address (String)
    _ActionIdx => GrowdropStarted or GrowdropEnded (Boolean)
    */
    contractinstance.getPastEvents("GrowdropAction", {filter: {_Growdrop: GrowdropAddress},fromBlock: 0,toBlock: 'latest'}).then(function(events) {
      /*
      events[i].returnValues._eventIdx, (Number)
      events[i].returnValues._Growdrop, (String)
      events[i].returnValues._ActionIdx, => false : GrowdropStarted, true : GrowdropEnded (Boolean)
      events[i].returnValues._ActionTime (Number unix timestamp)
      */ 
    });
  },

  newGrowdropContractPastEvents: async function(contractinstance, account) {
    /*
    filter : 
    _eventIdx, => event number (Number)
    _idx, => growdrop contract index (Number)
    _beneficiary => Growdrop contract beneficiary (String)
    */
    contractinstance.getPastEvents("NewGrowdropContract", {filter: {_beneficiary:account}, fromBlock: 0, toBlock: 'latest'}).then(function(events) {
      /*
      events[i].returnValues._eventIdx, (Number)
      events[i].returnValues._idx, (Number)
      events[i].returnValues._beneficiary, (String)
      events[i].returnValues._GrowdropAddress (String)
      */ 
    });
  },

  allPastEvents: async function(contractinstance) {
    /*
    filter: no filtering
    */
    contractinstance.getPastEvents("allEvents", {fromBlock: 0, toBlock: 'latest'}).then(function(events) {
      /*
      events[i].event => event name
      events[i].returnValues... => event results
      */
    });
  },

  refresh: async function() {
    const DAIbalance = await this.TokenBalanceOfCall(this.DAI, App.account);
    const SimpleTokenbalance = await this.TokenBalanceOfCall(this.SimpleToken, App.account);

    const DAIAllowance = await App.TokenAllowanceCall(App.DAI, App.account, App.Growdrop._address);
    const SimpleTokenAllowance = await App.TokenAllowanceCall(App.SimpleToken, App.account, App.Growdrop._address);
    const DaiToEthPrice = await App.UniswapTokenToEthInputPriceCall(App.UniswapDAIExchange, "1000000000000000000");
    const UniswapSimpleTokenbalance = await App.TokenBalanceOfCall(App.SimpleToken, App.UniswapSimpleTokenExchangeAddress);
    const UniswapSimpleTokenEthbalance = await App.GetBalanceCall(App.UniswapSimpleTokenExchangeAddress);
    
    const DAIbalanceElement = document.getElementsByClassName("DAIbalance")[0];
    this.setElement_innerHTML(DAIbalanceElement, DAIbalance);
    const SimpleTokenbalanceElement = document.getElementsByClassName("SimpleTokenbalance")[0];
    this.setElement_innerHTML(SimpleTokenbalanceElement, SimpleTokenbalance);
    const DAIAllowanceElement = document.getElementsByClassName("DAIAllowance")[0];
    App.setElement_innerHTML(DAIAllowanceElement, DAIAllowance);
    const SimpleTokenAllowanceElement = document.getElementsByClassName("SimpleTokenAllowance")[0];
    App.setElement_innerHTML(SimpleTokenAllowanceElement, SimpleTokenAllowance);

    const UniswapSimpleTokenEthPoolElement = document.getElementsByClassName("UniswapSimpleTokenEthPool")[0];
    App.setElement_innerHTML(UniswapSimpleTokenEthPoolElement, UniswapSimpleTokenEthbalance);
    const UniswapSimpleTokenTokenPoolElement = document.getElementsByClassName("UniswapSimpleTokenTokenPool")[0];
    App.setElement_innerHTML(UniswapSimpleTokenTokenPoolElement, UniswapSimpleTokenbalance);
    const UniswapDaiToEthElement = document.getElementsByClassName("UniswapDaiToEth")[0];
    App.setElement_innerHTML(UniswapDaiToEthElement, DaiToEthPrice);

    const GrowdropData_value = await App.GetGrowdropDataCall(App.Growdrop);

    if(GrowdropData_value[8]==false) {
      $(document).find('.GrowdropStatusdisplay').text("pending");
    } else if (GrowdropData_value[7]==false) {
      $(document).find('.GrowdropStatusdisplay').text("running");
    } else {
      $(document).find('.GrowdropStatusdisplay').text("ended");
    }

    $(document).find('.GrowdropTokendisplay').text(GrowdropData_value[0]);
    $(document).find('.Beneficiarydisplay').text(GrowdropData_value[1]);
    $(document).find('.GrowdropStartTimedisplay').text(new Date(parseInt(GrowdropData_value[3]*1000)));
    $(document).find('.GrowdropEndTimedisplay').text(new Date(parseInt(GrowdropData_value[4]*1000)));
    $(document).find('.GrowdropPerioddisplay').text((parseInt(GrowdropData_value[4]*1000)-parseInt(GrowdropData_value[3]*1000)));
    $(document).find('.GrowdropAmountdisplay').text(App.withDecimal(GrowdropData_value[2]));

    const GrowdropOver_value = GrowdropData_value[7];
    if(GrowdropOver_value) {
      const UserData_value = await App.GetUserDataCall(App.Growdrop, App.account);
      $(document).find('.TotalInterestdisplay').text(App.withDecimal(GrowdropData_value[6]));
      $(document).find('.TotalMintedAmountdisplay').text(App.withDecimal(String(Number(GrowdropData_value[5])-Number(GrowdropData_value[6]))));
      $(document).find('.TotalBalancedisplay').text(App.withDecimal(GrowdropData_value[5]));

      $(document).find('.TotalPerAddressdisplay').text(App.withDecimal(UserData_value[1]));
      $(document).find('.InvestAmountPerAddressdisplay').text(App.withDecimal(UserData_value[0]));
      $(document).find('.InterestPerAddressdisplay').text(App.withDecimal(UserData_value[2]));
      $(document).find('.InterestRatedisplay').text(App.withDecimal(UserData_value[3]));
      $(document).find('.TokenByInterestdisplay').text(App.withDecimal(UserData_value[4]));
    } else {
      $(document).find('.TotalBalancedisplay').text(App.withDecimal(GrowdropData_value[5]));
      $(document).find('.TotalMintedAmountdisplay').text(App.withDecimal(GrowdropData_value[6]));

      if(Number(GrowdropData_value[5])<=Number(GrowdropData_value[6])) {
        $(document).find('.TotalInterestdisplay').text("wait for accrueinterest transaction");
        $(document).find('.TotalPerAddressdisplay').text("wait for accrueinterest transaction");
        $(document).find('.InvestAmountPerAddressdisplay').text("wait for accrueinterest transaction");
        $(document).find('.InterestPerAddressdisplay').text("wait for accrueinterest transaction");
        $(document).find('.InterestRatedisplay').text("wait for accrueinterest transaction");
        $(document).find('.TokenByInterestdisplay').text("wait for accrueinterest transaction");
      } else {
        const TotalPerAddressres = await App.TotalPerAddressCall(App.Growdrop, App.account);
        $(document).find('.TotalPerAddressdisplay').text(App.withDecimal(TotalPerAddressres));
        
        const InvestAmountPerAddressres = await App.InvestAmountPerAddressCall(App.Growdrop, App.account);
        $(document).find('.InvestAmountPerAddressdisplay').text(App.withDecimal(InvestAmountPerAddressres));

        if(Number(TotalPerAddressres)<=Number(InvestAmountPerAddressres)) {
          $(document).find('.TotalInterestdisplay').text("wait for accrueinterest transaction");
          $(document).find('.InterestPerAddressdisplay').text("wait for accrueinterest transaction");
          $(document).find('.InterestRatedisplay').text("wait for accrueinterest transaction");
          $(document).find('.TokenByInterestdisplay').text("wait for accrueinterest transaction");
        } else {
          const UserData_value = await App.GetUserDataCall(App.Growdrop, App.account);
          $(document).find('.TotalInterestdisplay').text(App.withDecimal(String(Number(GrowdropData_value[5])-Number(GrowdropData_value[6]))));
          $(document).find('.InterestPerAddressdisplay').text(App.withDecimal(UserData_value[2]));
          $(document).find('.InterestRatedisplay').text(App.withDecimal(UserData_value[3]));
          $(document).find('.TokenByInterestdisplay').text(App.withDecimal(UserData_value[4]));
        }
      }
    }

    App.getUserActionPastEvents(App.GrowdropManager, App.Growdrop._address, App.account);   
  },

  refreshGrowdrop: async function() {
    const getGrowdropListLengthres = await App.GetGrowdropListLengthCall(App.GrowdropManager);
    if(Number(getGrowdropListLengthres)==0) {
      App.setStatus("there is no growdrop contract yet");
    } else {
      const getGrowdropres = await App.GetGrowdropCall(App.GrowdropManager,Number(getGrowdropListLengthres)-1);

      App.Growdrop = this.contractInit(GrowdropArtifact.abi, getGrowdropres);
    }
  },

  bindEvents: function() {
    $(document).on('click', '.Mintbutton', App.Mint);
    $(document).on('click', '.Redeembutton', App.Redeem);
    $(document).on('click', '.Withdrawbutton', App.Withdraw);
  },

  Mint: async function(event) {
    event.preventDefault();
    var MintAmount = parseInt(document.getElementById("Mintinput").value);
    App.setStatus("Initiating Mint transaction... (please wait)");
    const Mint_res = await App.MintTx(App.Growdrop, String(MintAmount*1000000000000000000), App.account);
    App.setStatus(Mint_res);
  },

  Redeem: async function(event) {
    event.preventDefault();
    var RedeemAmount = parseInt(document.getElementById("Redeeminput").value);
    App.setStatus("Initiating Redeem transaction... (please wait)");
    const Redeem_res = await App.RedeemTx(App.Growdrop, String(RedeemAmount*1000000000000000000), App.account);
    App.setStatus(Redeem_res);
  },

  Withdraw: async function(event) {
    event.preventDefault();
    const add_to_uniswap = parseInt(document.getElementById("AddToUniswap").value);
    App.setStatus("Initiating Withdraw transaction... (please wait)");
    if(add_to_uniswap==1) {
      const Withdraw_res = await App.WithdrawTx(App.Growdrop, true, App.account);
      App.setStatus(Withdraw_res);
    } else {
      const Withdraw_res = await App.WithdrawTx(App.Growdrop, false, App.account);
      App.setStatus(Withdraw_res);
    }
  },

  approveDAI: async function() {
    const amount = parseInt(document.getElementById("DAIamount").value);

    App.setStatus("Initiating approveDAI transaction... (please wait)");
    const approve_res = await App.TokenApproveTx(App.DAI, App.Growdrop._address, String(amount * 1000000000000000000), App.account);
    App.setStatus(approve_res);
  },

  approveSimpleToken: async function() {
    const amount = parseInt(document.getElementById("SimpleTokenamount").value);

    App.setStatus("Initiating approveSimpleToken transaction... (please wait)");
    const approve_res = await App.TokenApproveTx(App.SimpleToken, App.Growdrop._address, String(amount * 1000000000000000000), App.account);
    App.setStatus(approve_res);
  },

  NewGrowdrop: async function() {
    const amount = parseInt(document.getElementById("NewGrowdropamount").value);
    const beneficiary = document.getElementById("NewGrowdropbeneficiary").value;
    const starttime = document.getElementById("GrowdropStartTime").value;
    const period = document.getElementById("GrowdropPeriod").value;
    const ToUniswapGrowdropTokenAmount = document.getElementById("ToUniswapGrowdropTokenAmount").value;
    const ToUniswapInterestRate = document.getElementById("ToUniswapInterestRate").value;

    App.setStatus("Initiating NewGrowdrop transaction... (please wait)");
    const newGrowdrop_res = await App.NewGrowdropTx(
      App.GrowdropManager,
      App.DAI._address,
      "0x6d7f0754ffeb405d23c51ce938289d4835be3b14",
      "0x1c73c83cbf5c39459292e7be82922d69f9d677e6",
      beneficiary,
      String(amount * 1000000000000000000),
      starttime,
      period,
      String(ToUniswapGrowdropTokenAmount*1000000000000000000),
      ToUniswapInterestRate,
      "0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36",
      "0xaF51BaAA766b65E8B3Ee0C2c33186325ED01eBD5",
      App.account
      );

    await App.refreshGrowdrop();
    await App.refresh();
    App.setStatus(newGrowdrop_res);
  },

  StartGrowdrop: async function() {
    App.setStatus("Initiating StartGrowdrop transaction... (please wait)");
    const StartGrowdrop_res = await App.StartGrowdropTx(App.Growdrop, App.account);
    App.setStatus(StartGrowdrop_res);
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  }
};

window.App = App;

window.addEventListener("load", function() {
  if (window.ethereum) {
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable();
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live"
    );
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:8545")
    );
  }

  App.start();
});
