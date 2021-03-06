import React, { Component } from 'react';
import axios from 'axios';
import { Address, Blockie, Scaler } from "dapparatus";
import ReactMarkdown from 'react-markdown';
import Loader from '../loader.gif';

class CreateGrants extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.getDetails();
  }
  getDetails = async () => {
    try {
      let id = this.props.match.params.id
      if(id){
        const response = await axios.get(this.props.backendUrl+`grants/`+id);
        console.log("RESPONSE DATA:",response.data)
        if(response.data&&response.data[0]){
          this.props.save(response.data[0])
          if(this.props.web3){
            let tokenContract = this.props.customContractLoader("Subscription",response.data[0].deployedAddress)
            this.props.save({author:await tokenContract.author().call(),contract:tokenContract,toAddress:await tokenContract.requiredToAddress().call()})
          }
        }
      }else{
        console.log("THIS IS A FRESH CREATE, CLEAR THE DATA")
        this.props.save({
          title: "",
          pitch: "",
          toAddress: this.props.account,
          deployedAddress: "",
          desc: "",
        })
      }
    } catch (error) {
      this.setState(() => ({ error }))
    }
  }
  render() {
    const input = '# This is a header\n\nAnd this is a paragraph'
    let recipient
    let deployedContract
    if(this.props.deployedAddress){
      deployedContract = (
        <div style={{padding:10}}>
          <Address
            {...this.props}
            address={this.props.deployedAddress.toLowerCase()}
          />
        </div>
      )
      recipient = (
        <div style={{padding:10}}>
          <Address
            {...this.props}
            address={this.props.toAddress.toLowerCase()}
          />
        </div>
      )
    }else{
      let loader = ""
      if(this.props.deployingGrantContract){
       loader = (
         <img src={Loader} style={{width: '50px', height: '50px', verticalAlign: 'middle', margin:'0 0 0 10px'}}/>
       )
      }
      deployedContract = (
        <div>
          <button className="btn btn-outline-primary" onClick={()=>{
              this.props.deployGrantContract(this.props.toAddress)
          }}>
            Deploy Grant Contract
          </button> {loader}
        </div>
      )
      recipient = (
        <div>
          <div>
            <Blockie
              address={this.props.toAddress.toLowerCase()}
              config={{size:3}}
            />
          </div>
          <div className="ml-md-3 w-100">
            <input type="text" name="toAddress" value={this.props.toAddress} onChange={this.props.handleInput} />
            <p className="help">The address that will receive the funding tokens.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="container">
        <h1 className="mb-5 text-center">Create A Grant</h1>

        <div>
          <div className="field is-horizontal">
            <div className="field-label">
              <label className="label">Title:</label>
            </div>
            <div className="field-body">
              <input className="form-control" type="text" name="title" value={this.props.title} onChange={this.props.handleInput} />
            </div>
          </div>

          <div className="field is-horizontal">
            <div className="field-label">
              <label className="label">Pitch:</label>
            </div>
            <div className="field-body">
              <textarea className="form-control" rows="3" name="pitch" value={this.props.pitch} onChange={this.props.handleInput}></textarea>
              <p className="help">Your short elevator pitch.</p>
            </div>
          </div>

          <div className="field is-horizontal">
            <div className="field-label">
              <label className="label">Recipient:</label>
            </div>
            <div className="field-body flex-row">
              {recipient}
            </div>
          </div>

          <div className="field is-horizontal">
            <div className="field-label">
              <label className="label">Contract:</label>
            </div>
            <div className="field-body">
              {deployedContract}
            </div>
          </div>

          <div className="field is-horizontal">
            <div className="field-label">
              <label className="label mb-0">Description:</label>
              <p><small>(Markdown)</small></p>
            </div>
            <div className="field-body">
              <textarea className="form-control" rows="20" name="desc" value={this.props.desc} onChange={this.props.handleInput}></textarea>
              <p className="help">A longer, more detailed description. Can be written in Markdown.</p>
            </div>
          </div>

          <div className="field is-horizontal">
            <div className="field-label">
              <label className="label">Preview:</label>
            </div>
            <div className="field-body">
              <ReactMarkdown source={this.props.desc} />
            </div>
          </div>

          <div className="field is-horizontal">
            <div className="field-label">
              <label className="label">Save Grant:</label>
            </div>
            <div className="field-body" style={{paddingBottom:150}}>
              <div className="mb-2">
                <button className="btn btn-lg btn-outline-primary" onClick={async ()=>{
                  if(!this.props.title){
                    alert("Please provide a title for your grant.")
                    return;
                  }
                  if(!this.props.pitch){
                    alert("Please provide a pitch for your grant.")
                    return;
                  }
                  if(!this.props.deployedAddress){
                    alert("Please deploy a contract for your grant.")
                    return;
                  }
                  if(!this.props.desc){
                    alert("Please provide a description for your grant.")
                    return;
                  }

                  let hash = this.props.web3.utils.soliditySha3(
                    this.props.title,
                    this.props.pitch,
                    this.props.deployedAddress,
                    this.props.desc
                  )
                  console.log("Hash:",hash)
                  let sig = await this.props.web3.eth.personal.sign(""+hash,this.props.account)
                  console.log("Sig:",sig)
                  this.props.submitGrant(hash,sig)

                }}>
                  Save Grant
                </button>
              </div>
              <p className="help">Saves the grant after the contract has been deployed.</p>
            </div>
          </div>

        </div>

      </div>
    );
  }
}

export default CreateGrants;
