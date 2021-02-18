import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { recoverNewPassword, getToken } from "../actions/userActions";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";

export default function UserValidatorScreen(props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const redirect = props.location.search
    ? props.location.search.split("=")[1]
    : "/";
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
  const userToken = useSelector((state) => state.userToken);
  const { success, error, loading } = userToken;

  const token = props.match.params.token;
  const dispatch = useDispatch();

  const submitHandler = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Password and Confirm Password Are Not Matched");
    } else {
      dispatch(recoverNewPassword( token, newPassword ));
    }
  };
  useEffect(() => {
    dispatch(getToken(token));
    if (userInfo) {
      props.history.push(redirect);
    }
  }, [props.history, dispatch, redirect, token, userInfo]);
  return (
    <div>
      <form className="form" onSubmit={submitHandler}>
        <div>
          <h1>This is validator screen</h1>
        </div>
        {loading ? (
          <LoadingBox></LoadingBox>
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <>
            {loading && <LoadingBox></LoadingBox>}
            {error && <MessageBox variant="danger">{error}</MessageBox>}
            {success && (
              <MessageBox variant="success">
               {success.message}
              </MessageBox>
            )}
            <div>
              <label htmlFor="newPassword">New Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                onChange={(e) => setNewPassword(e.target.value)}
                required
              ></input>
            </div>
            <div>
              <label htmlFor="confirmPassword">confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Enter confirm password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              ></input>
            </div>

            <div>
              <label />
              <button className="primary" type="submit">
                Update
              </button>
            </div>
          </>
        )}
        <div>
          <label />
          <div>
            New customer?{" "}
            <Link to={`/register?redirect=${redirect}`}>
              Create your account
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
