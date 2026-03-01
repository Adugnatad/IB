"use client";

import React, { Fragment } from "react";
import { Container, Row, Col, Card, CardBody } from "reactstrap";
import CardHeaderCommon from "@/CommonComponents/CardHeaderCommon";

const CustomerPage = () => {
  return (
    <Fragment>
      <Container fluid={true}>
        <Row>
          <Col sm="12">
            <Card>
              <CardHeaderCommon
                title="Welcome to Internet Banking"
                description="Cooperative Bank of Oromia - Secure online banking at your fingertips"
              />
              <CardBody>
                <p>
                  Welcome to Cooperative Bank of Oromia Internet Banking Portal.
                  Access your accounts, transfer funds, pay bills, and manage your
                  finances securely online. Use the menu to navigate to the
                  services you need.
                </p>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};

export default CustomerPage;
