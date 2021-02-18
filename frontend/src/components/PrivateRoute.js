import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';

export default function PrivateRoute({ component: Component, ...rest }) {
  const userSignin = useSelector((state) => state.userSignin);
  if (!userSignin.userInfo) return <Redirect to="/signin" />;
  return (
    <Route
      {...rest}
      render={(props) => <Component {...props} />}
    />
  );
}
