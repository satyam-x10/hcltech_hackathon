import React, { useState } from "react";
import {
  Card,
  Descriptions,
  Avatar,
  Tag,
  Divider,
  Modal,
  Tabs,
  Button,
  message,
  Input,
  Form,
  List,
} from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import Natasha from "./Natasha";

const { TabPane } = Tabs;

const UserProfileCard = ({ user }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [investmentTips, setInvestmentTips] = useState([]);

  if (!user) return null;

  const {
    name,
    id_number,
    dob,
    gender,
    photo,
    address,
    contact,
    account_info,
    loan_info,
    investment_profile,
    kyc_status,
    preferred_language,
    access_channels,
    session_flags,
  } = user;
  const [balance, setBalance] = useState(null);
  const [RecipientAccount, setRecipientAccount] = useState(null);
  const [Amount, setAmount] = useState(null);
  const [investmentAdvice, setInvestmentAdvice] = useState(null);

  const [transactionHistory, setTransactionHistory] = useState([]);
  const [choices, setChoices] = useState(null);

  const [loanStatus, setLoanStatus] = useState(null);

  const [natasha, setNatasha] = useState(null);

  // 1. Check Balance
  const handleCheckBalance = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/user/${user.id_number}/balance`
      );
      const data = await res.json();
      message.success(`Your balance is ₹${data.balance} ${data.currency}`);
      setBalance(data.balance);
    } catch (err) {
      message.error("Failed to fetch balance.");
    }
  };

  // 2. Transfer Funds
  const handleFundTransfer = async ({ to_account, amount }) => {
    console.log(to_account, amount);

    try {
      const res = await fetch(
        `http://localhost:8000/user/${user.id_number}/transfer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to_account, amount }),
        }
      );
      const data = await res.json();
      setTransactionHistory(data.transaction_history || []);

      if (res.ok) {
        alert(data.message);
        message.success(data.message || "Transfer successful.");
      } else message.error(data.error || "Transfer failed.");
    } catch (err) {
      message.error("Error during fund transfer.");
    }
  };

  // 3. Loan Application
  const handleLoanApplication = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/user/${user.id_number}/loan`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      if (res.ok) {
        setLoanStatus(data.loan_status || "No status returned.");

        message.success(data.message || "Loan submitted.");
      } else message.error(data.error || "Loan request failed.");
    } catch (err) {
      message.error("Error submitting loan request.");
    }
  };

  // 4. Investment Advice
  const handleInvestmentAdvice = async (choice) => {
    console.log(choice);

    try {
      const res = await fetch(
        `http://localhost:8000/user/${user.id_number}/advice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choice }), // Important: body must be an object
        }
      );
      const data = await res.json();
      if (res.ok) {
        console.log(data);

        setInvestmentAdvice(data.advice || "No advice returned.");
        message.success("Investment advice received.");
      } else {
        message.error(data.detail || "Failed to get advice.");
      }
    } catch (err) {
      message.error("Error fetching investment advice.");
    }
  };

  return (
    <Card
      title="User Profile"
      bordered
      style={{ maxWidth: 800, margin: "auto", marginTop: 20 }}
    >
      <Descriptions title="Personal Info" bordered column={2}>
        <Descriptions.Item label="Name">{name}</Descriptions.Item>
        <Descriptions.Item label="ID Number">{id_number}</Descriptions.Item>
        <Descriptions.Item label="DOB">{dob}</Descriptions.Item>
        <Descriptions.Item label="Gender">{gender}</Descriptions.Item>
        <Descriptions.Item label="Email">
          <MailOutlined /> {contact?.email}
        </Descriptions.Item>
        <Descriptions.Item label="Phone">
          <PhoneOutlined /> {contact?.phone}
        </Descriptions.Item>
        <Descriptions.Item label="Address" span={2}>
          {`${address?.street}, ${address?.city}, ${address?.state} - ${address?.postal_code}, ${address?.country}`}
        </Descriptions.Item>
        <Descriptions.Item label="KYC Status">
          <Tag color={kyc_status === "Verified" ? "green" : "red"}>
            {kyc_status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Language">
          {preferred_language}
        </Descriptions.Item>
      </Descriptions>
      <button> update profile</button>
      <Descriptions title="Account Info" bordered column={2}>
        <Descriptions.Item label="Account No">
          {account_info?.account_number}
        </Descriptions.Item>
        <Descriptions.Item label="Type">{account_info?.type}</Descriptions.Item>
        <Descriptions.Item label="Balance">
          {`${account_info?.balance} ${account_info?.currency}`}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          {account_info?.status}
        </Descriptions.Item>
      </Descriptions>
      <Button
        type="primary"
        style={{ marginTop: 16 }}
        onClick={() => setModalVisible(true)}
      >
        Start Banking
      </Button>

      <Button
        type="primary"
        style={{ marginTop: 16 }}
        onClick={() => {setNatasha(true)}}
      >
        Start talking to natasha
      </Button>
      {natasha && 
      <Natasha setNatasha={setNatasha} user={user}/>}

      <Divider />

   

      <Divider />
      <Avatar
        size={120}
        src={`data:image/png;base64,${photo}`}
        icon={<UserOutlined />}
      />

      {/* Modal Banking Assistant */}
      <Modal
        title="MetaHuman Banking Assistant"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Check Balance" key="1">
            <Button type="primary" onClick={handleCheckBalance}>
              View Balance
            </Button>
            {balance}
          </TabPane>

          <TabPane tab="Transfer Funds" key="2">
            <Form layout="vertical" onFinish={handleFundTransfer}>
              <Form.Item
                label="Recipient Account No"
                rules={[{ required: true }]}
              >
                <Input
                  placeholder="e.g., 999000111222"
                  value={RecipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value)}
                />
              </Form.Item>

              <Form.Item
                label="Amount (₹)"
                rules={[{ required: true, type: "number", min: 1 }]}
              >
                <Input
                  type="number"
                  value={Amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  onClick={() =>
                    handleFundTransfer({
                      to_account: RecipientAccount,
                      amount: Amount,
                    })
                  }
                >
                  Transfer
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="Apply for Loan" key="3">
            <Button type="primary" onClick={handleLoanApplication}>
              Submit Loan Application
            </Button>
            {loanStatus && (
              <Card title="Loan Status" bordered style={{ marginTop: 20 }}>
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Approved">
                    {loanStatus.approved ? "✅ Yes" : "❌ No"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Amount">
                    ₹ {loanStatus.amount?.toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Interest Rate">
                    {loanStatus.interest_rate}%
                  </Descriptions.Item>
                  <Descriptions.Item label="Remarks">
                    {loanStatus.remarks}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </TabPane>

          <TabPane tab="Investment Advice" key="4">
            {investmentAdvice ? (
              <div>
                {investmentAdvice}
              </div>
            ) : (
              <Form
                layout="vertical"
                onFinish={() => handleInvestmentAdvice(choices)}
              >
                <Form.Item
                  label="Describe your investment goals or interests"
                  name="goals"
                  rules={[
                    { required: true, message: "Please enter your goals" },
                  ]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="e.g., long-term growth, retirement planning, low risk"
                    value={choices}
                    onChange={(e) => setChoices(e.target.value)}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Get Advice
                  </Button>
                </Form.Item>
              </Form>
            )}
          </TabPane>

          <TabPane tab="History" key="5">
            <div>
              <h4>Transaction History</h4>
              {transactionHistory.length === 0 ? (
                <p>No transactions yet.</p>
              ) : (
                <ul>
                  {transactionHistory.map((tx, index) => (
                    <li key={index}>
                      {`₹${tx.amount} ${tx.type} to ${
                        tx.recipient || "N/A"
                      } on ${new Date(tx.date).toLocaleString()}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabPane>
        </Tabs>
      </Modal>
    </Card>
  );
};

export default UserProfileCard;
