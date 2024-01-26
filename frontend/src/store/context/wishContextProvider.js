import React from "react";
import { useEffect, useState } from "react";
import WishContext from "./wish-context.js";
import LoginContext from "./login-context.js";
import axios from "axios";
import { ToLink } from "../../constants.js";
import { useCookies } from "react-cookie";
import { useContext } from "react";
import { useAlert } from "./Alert-context.js";

const WishContextProvider = (props) => {
  const { showAlert } = useAlert();
  const loginCtx = useContext(LoginContext);
  const [lengthx, setLengthx] = useState(0);
  const [wish, setWish] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [cookie] = useCookies(["token"]);

  const isLoggedIn = loginCtx.isLoggedIn;
  const resp = async () => {
    if (!isLoggedIn) return;
    try {
      console.log("resp rendered", cookie.token);

      const data = await axios.get(`${ToLink}/cart/wishlist`, {
        headers: {
          Authorization: `Bearer ${cookie.token}`,
        },
      });
      console.log(data);
      const ProductId = data.data.data.wishlist;
      if (ProductId && ProductId.length === 0) {
        setLengthx(0);
        setWish([]);
        setTotalPrice(0);
        return;
      }

      let length = 0;
      data.data.data.wishlist.forEach((item) => {
        length++;
      });
      setLengthx(length);
      const productPromises = ProductId.map(async (item) => {
        const productData = await axios.get(
          `${ToLink}/product_data/products/${item.product_id}`
        );
        productData.data.data.quantity = item.quantity;
        return productData.data.data;
      });

      const productDataArray = await Promise.all(productPromises);
      const newData = productDataArray.map((item) => {
        const newItem = { ...item };
        newItem.image = JSON.parse(item.image);
        newItem.product_category_tree = JSON.parse(item.product_category_tree);
        return newItem;
      });

      console.log("newData: ", newData);
      const TP = newData
        .map((item) => {
          const price = item.discounted_price || item.retail_price;
          const quantity = item.quantity;
          const total = price * 1 * quantity * 1;
          return total;
        })
        .reduce((acc, itemTotal) => acc + itemTotal, 0);
      setTotalPrice(TP);
      setWish(newData);
    } catch (err) {
      console.log(err);
    }
  };

  const addtoWishHandler = (productid, quantity = 1) => {
    const quant = Math.floor(quantity * 1);

    const sendData = async () => {
      console.log("addtoWishHandler rendered");
      try {
        const data = {
          product_id: productid,
          quantity: quant,
        };
        if (!isLoggedIn)
          return showAlert("danger", "Please login to add to wishlist");
        const response = await axios.post(`${ToLink}/cart/wishlist`, data, {
          headers: {
            Authorization: `Bearer ${cookie.token}`,
          },
        });
        console.log(response, "response");
        if (response.status === 200) {
          resp();
        }
        console.log(response);
        showAlert("success", "Added to wishlist successfully");
      } catch (err) {
        console.log(err);
      }
    };
    sendData();
  };

  const deleteHandler = (productid) => {
    const deleteData = async () => {
      console.log("deleteHandler rendered");
      try {
        const data = {
          product_id: productid,
          quantity: 0,
        };
        if (!isLoggedIn)
          return showAlert("danger", "Please login to remove from wishlist");
        const response = await axios.post(`${ToLink}/cart/wishlist`, data, {
          headers: {
            Authorization: `Bearer ${cookie.token}`,
          },
        });
        if (lengthx === 1) {
          clear();
        }
        if (response.status === 200) {
          resp();
        }
        showAlert("success", "Removed from wishlist successfully");
      } catch (err) {
        console.log(err);
      }
    };

    deleteData();
  };
  const refresh = () => {
    console.log("refresh rendered", cookie.token);
    resp();
  };
  const clear = () => {
    setLengthx(0);
    setWish([]);
    setTotalPrice(0);
  };

  useEffect(() => {
    resp();
  }, [cookie.token, isLoggedIn]);

  const context = {
    wishItemNumber: lengthx,
    wish: wish,
    addInWish: addtoWishHandler,
    removeFromWish: deleteHandler,
    total: totalPrice,
    clear: clear,
    refresh: refresh,
  };

  return (
    <WishContext.Provider value={context}>
      {props.children}
    </WishContext.Provider>
  );
};

export default WishContextProvider;
