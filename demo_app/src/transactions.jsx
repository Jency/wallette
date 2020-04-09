// General React components
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

// General function libraries
import * as index from './index.js';

// Libraries for table
import DataTable, { createTheme } from 'react-data-table-component';
import Card from '@material-ui/core/Card';

var data = [];
var pending;
var txnHash;


createTheme('Fortmatic', {
    text: {
        primary: '#268bd2',
        secondary: '#2aa198',
    },
    background: {
        default: 'rgb(231, 236, 242)',
    },
    context: {
        background: '#cb4b16',
        text: '#FFFFFF',
    },
    divider: {
        default: '#073642',
    },
    action: {
        button: 'rgba(0,0,0,.54)',
        hover: 'rgba(0,0,0,.08)',
        disabled: 'rgba(0,0,0,.12)',
    },
});

const style = {
    rows: {
        style: {
            maxWidth: '1033px', // override the row height
            fontWeight: '700'
        }
    },

    header: {
        style: {
            fontSize: '30px',
            fontWeight: 700
        }
    },

    headCells: {
        style: {
            fontSize: '20px',
            fontWeight: 700
        }
    },

    cells: {
        style: {
            fontSize: '20px',
            fontWeight: 700
        }
    },

    expanderRow: {
        style: {
            fontSize: '15px',
            fontWeight: 700
        }
    }
}

export class Transactions extends Component {
    componentWillUnmount() {
        data = [];
    }

    columns = [
        {
            name: 'Tx hash',
            selector: 'txHash',
            sortable: false
        },
        {
            name: 'To',
            selector: 'to',
            sortable: true
        },
        {
            name: 'Amount',
            selector: 'amt',
            sortable: true
        }
    ]

    render() {
        return (
            <div className="main">
                <div className="bigBlock">
                    <div id="pending">
                        <Card>
                            <DataTable
                                title="Pending Transactions"
                                columns={this.columns}
                                data={data}
                                expandOnRowClicked
                                //theme="Fortmatic"
                                customStyles={style}
                                highlightOnHover
                                expandableRows
                                expandableRowsComponent={<this.composition />} />
                        </Card>
                    </div>
                    <h1 className="head_boxST">New Transaction</h1>

                    <div>
                        <input type="text" id="address" placeholder="Send to Address" />
                        <input type="number" id="exchangeAmt" placeholder="Transaction amount" />
                        {/* <input type="number" id="threshold" placeholder="Send threshold" /> */}
                        <a className="stTran" onClick={this.setupTransaction}>Start Transaction</a>
                    </div>
                </div>
            </div>
        );
    }

    composition = ({ data }) => {
        const index = data.id;
        const link = "https://rinkeby.etherscan.io/tx/" + txnHash[index];

        return (
            <div className="compostion">
                <p>Transaction Hash: {txnHash[index]}</p>
                <p>From: {pending[index].txnData.from}</p>
                <p>To: {pending[index].txnData.to}</p>
                <p>Number of Signatures: {pending[index].numSigs}/{pending[index].txnData.threshold}</p>
                <a href={link}>View on Etherscan</a>
                <br></br>
                <br></br>
                <button onClick={this.signContract(index)}>Sign Transaction</button>
                <p id="status"></p>
            </div>
        );
    }

    startTransaction = async () => {
        const userAddress = (await index.fmPhantom.user.getMetadata()).publicAddress;
        const amount = document.getElementById('exchangeAmt').value;
        const sendAddress = document.getElementById('sendAddress').value;
        //const threshold = document.getElementById('threshold').value;
        const threshold = 3;

        var txnHash;

        await index.contract.methods.setupTransaction(sendAddress, threshold, amount).send({
            from: userAddress,
            gas: 1500000,
            gasPrice: '3000000000000',
            value: amount
        })
            .on('receipt', (rec) => {
                console.log(rec);
                txnHash = rec.transactionHash;
                document.getElementById('status').innerHTML = "Transaction started";
            });

        await index.contract.methods.setHash(txnHash).send({
            from: userAddress,
            gas: 1500000,
            gasPrice: '3000000000000'
        })
            .then(console.log);
    }

    signContract = async (i) => {
        const userAddress = (await index.fmPhantom.user.getMetadata()).publicAddress;

        await index.contract.methods.signTransaction(i).send({
            from: userAddress,
            gas: 1500000,
            gasPrice: '3000000000000'
        })
            .on('receipt', (rec) => {
                console.log(rec);
                if (rec.events.transactionOccured != null) {
                    document.getElementById('status').innerHTML = "Transacted " + rec.events.transactionOccured.returnValues[0]
                        + " to " + rec.events.transactionOccured.returnValues[1];
                }
                else {
                    document.getElementById('status').innerHTML = rec.events.SignedTransact.returnValues[0] + " signed transaction";
                }
            });
    }
}

export let getPending = async () => {
    pending = await index.contract.methods.getPendingTx().call();
    txnHash = await index.contract.methods.getHashes().call();

    for (let i = 0; i < pending.length; ++i) {
        data.push({
            id: i, txHash: txnHash[i], to: pending[i].txnData.to, amt: pending[i].txnData.amount
        })
    }

    console.log(data);
}