import React from 'react';
import { connect } from 'react-redux';
import agent from '../../agent';

import {
  HOME_PAGE_LOADED,
  HOME_PAGE_UNLOADED,
  APPLY_TAG_FILTER,
  PAYMENT_REQUEST,
  PAYMENT_SUCCESS,
  PAYMENT_FAILURE
} from '../../constants/actionTypes';

const Promise = global.Promise;

const mapStateToProps = state => ({
  ...state.home,
  appName: state.common.appName,
  token: state.common.token,
  loading: state.common.loading,
  payment: state.common.payment,
  error: state.common.error
});

const mapDispatchToProps = dispatch => ({
  onClickTag: (tag, pager, payload) =>
    dispatch({ type: APPLY_TAG_FILTER, tag, pager, payload }),
  onLoad: (tab, pager, payload) =>
    dispatch({ type: HOME_PAGE_LOADED, tab, pager, payload }),
  onUnload: () =>
    dispatch({  type: HOME_PAGE_UNLOADED }),
  onSubmit: () =>
    dispatch({ type: PAYMENT_REQUEST }),
  onSuccess: (payload) =>
    dispatch({ type: PAYMENT_SUCCESS, payload }),
  onError: (payload) =>
    dispatch({ type: PAYMENT_FAILURE, payload })
});

class Home extends React.Component {
  state= {
    isValid: false
  };

  componentWillMount() {
    const tab = this.props.token ? 'feed' : 'all';
    const articlesPromise = this.props.token ?
      agent.Articles.feed :
      agent.Articles.all;

    this.props.onLoad(tab, articlesPromise, Promise.all([agent.Tags.getAll(), articlesPromise()]));
  }

  componentWillUnmount() {
    this.props.onUnload();
  }

  handleChange = () => {
    const { type, number, expiry, name, email } = this.refs.paymentForm;

    // card number validation
    const cardNumberValid = parseInt(number.value) && (number.value.length === 16 || (number.value.length === 15 && type.value === 'Amex'));

    // expiry validation
    const expiryValid = /(0[1-9]|10|11|12)\/[0-9]{2}$/.test(expiry.value);

    // name validation
    const nameValid = /^[a-zA-Z ]+$/.test(name.value) && name.value.length <= 50;

    // email validation
    const emailValid = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email.value) || !email.value.length;

    this.setState({ isValid: cardNumberValid && expiryValid && nameValid && emailValid })
  }

  handleSubmit = (e) => {
    e.preventDefault();

    const { onSubmit, onSuccess, onError } = this.props;
    const { isValid } = this.state;
    const { type, number, expiry, name, email } = e.target;
 
    if (isValid) {
      onSubmit(agent.Payment.sendPayment({
        type: type.value,
        number: number.value,
        expiry: expiry.value,
        name: name.value,
        email: email.value
      })
        .then(onSuccess)
        .catch(onError)
      );
    }
  }

  render() {
    const { payment, error } = this.props;
    const { isValid } = this.state;

    return (
      <div className="home-page container">
        <div className="row">
          {payment && <div className="col-md-6">
            <div>Approval code: {payment.approvalCode}</div>
            <div>Invoice number: {payment.invoiceNo}</div>
            <div>Response code: {payment.responseCode}</div>
            <div>{payment.responseMessage}</div>
          </div>}
          {error && <div className="col-md-6">
            <div>Approval code: {payment.approvalCode}</div>
            <div>Invoice number: {payment.invoiceNo}</div>
            <div>Response code: {payment.responseCode}</div>
            <div>{payment.responseMessage}</div>
          </div>}
          {!payment && !error && <form
            className="col-md-6"
            ref="paymentForm"
            onChange={this.handleChange}
            onSubmit={this.handleSubmit}
          >
            <div className="form-group">
              <label htmlFor='type'>Card Types:</label>
              <select name='type' className="form-control">
                <option>Visa</option>
                <option>MasterCard</option>
                <option>Amex</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor='number'>Card Number: </label>
              <input type='text' name='number' className="form-control" />
            </div>
            <div className="form-group">
              <label htmlFor=''>Expiry:: </label>
              <input type='text' name='expiry' className="form-control" />
            </div>
            <div className="form-group">
              <label htmlFor=''>Name: </label>
              <input type='text' name='name' className="form-control" />
            </div>
            <div className="form-group">
              <label htmlFor=''>Email: </label>
              <input type='email' name='email' className="form-control" />
            </div>
            <button
              type='submit'
              className='btn btn-primary'
              disabled={!isValid}
            >
              Confirm Payment
            </button>
          </form>}
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
