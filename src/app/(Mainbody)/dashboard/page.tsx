"use client";

import React, { Fragment } from "react";
import { Container, Row, Col, Card, CardBody } from "reactstrap";
import Breadcrumbs from "@/CommonComponents/BreadCrumb";
import CardHeaderCommon from "@/CommonComponents/CardHeaderCommon";
import NoticeAlert from "@/CommonComponents/NoticeAlert";
import { ContractsExecutiveDashboard } from "@/features/contracts/ContractsExecutiveDashboard";
import { ContractsRecentActivityPanel } from "@/features/contracts/ContractsRecentActivityPanel";

const Dashboard = () => {
  return (
    <Fragment>
      <Breadcrumbs mainTitle="Dashboard" parent="Home" title="Dashboard" />
      <Container fluid={true}>
        <Row>
          <Col sm="12">
            <Card>
              <CardHeaderCommon
                title="Executive Contract Dashboard"
                description="Real-time contract operations cockpit"
                titleClassName="text-primary"
              />
              <CardBody>
                <NoticeAlert
                  notice="Monitor contract health, compare statuses, and navigate operational KPIs in one place."
                />
                <ContractsExecutiveDashboard />
                <ContractsRecentActivityPanel />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};

export default Dashboard;
