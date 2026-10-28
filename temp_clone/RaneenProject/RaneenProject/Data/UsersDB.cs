using Firebase.Database;
using Firebase.Database.Query;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RaneenProject.Models;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RaneenProject.Data
{
    public class UsersDB
    {

        //FirebaseClient firebase = new FirebaseClient("https://raneendb-90788-default-rtdb.europe-west1.firebasedatabase.app/");

        public static string FirebaseClient = "https://raneendb-90788-default-rtdb.europe-west1.firebasedatabase.app/";
        public static string FrebaseSecret = "NFnB6WS5ppefCvQNHqQXZTWEP3vbJb424NAsPQjJ";

        public FirebaseClient firebase = new FirebaseClient(FirebaseClient,
                                   new FirebaseOptions { AuthTokenAsyncFactory = () => Task.FromResult(FrebaseSecret) });

        public async Task<List<Users>> GetAllUsers()
        {
            try
            {
                var userlist = (await firebase
              .Child("Users")
              .OnceAsync<Users>()).Select(item => new Users
              {
                  Firstname = item.Object.Firstname,
                  Lastname = item.Object.Lastname,
                  Email = item.Object.Email,
                  Phone = item.Object.Phone,
                  Cart = item.Object.Cart,
                  Wishlist = item.Object.Wishlist
              }).ToList();

                return userlist;
            }
            catch (Exception e)
            {
                Debug.WriteLine($"Error:{e}");
                return null;
            }


        }
        public async Task<bool> AddUser(Users nuser)
        {
            try
            {
                await firebase
                .Child("Users")
                .PostAsync(
                  new Users()
                  {
                      Firstname = nuser.Firstname,
                      Lastname = nuser.Lastname,
                      Email = nuser.Email,
                      Phone = nuser.Phone,
                      Cart = nuser.Cart,
                      Wishlist = nuser.Wishlist,

                  });
                return true;
            }
            catch (Exception e)
            {
                Debug.WriteLine($"Error:{e}");
                await App.Current.MainPage.DisplayAlert($"Error:{e}", "OK", "Cancel");
                return false;
            }

        }
        public async Task<Users> GetUser(String email)
        {
            try
            {
                var allUsers = await GetAllUsers();
                return allUsers.Where(a => a.Email == email).FirstOrDefault();
            }
            catch (Exception e)
            {
                Debug.WriteLine($"Error:{e}");
                return null;
            }


        }

        public async Task<bool> AddToCart(string email, Product product)
        {
            try
            {
                var toUpdatePerson = (await firebase
                .Child("Users")
                .OnceAsync<Users>()).Where(a => a.Object.Email == email).FirstOrDefault();

                ObservableCollection<Product> p;

                if (toUpdatePerson.Object != null)
                {
                    //string[] words = product.PreviewImage.Split('/');
                    //product.PreviewImage = words.Last();
                    //await App.Current.MainPage.DisplayAlert("new", product.PreviewImage + words.Last()  , "Ok");

                    if (toUpdatePerson.Object.Cart != string.Empty)
                    {
                        p = JsonConvert.DeserializeObject<ObservableCollection<Product>>(toUpdatePerson.Object.Cart);
                        p.Add(product);
                    }
                    else
                    {
                        p = new ObservableCollection<Product>() { product };
                    }

                    await firebase
                      .Child("Users")
                      .Child(toUpdatePerson.Key)
                      .PutAsync(
                        new Users()
                        {
                            Firstname = toUpdatePerson.Object.Firstname,
                            Lastname = toUpdatePerson.Object.Lastname,
                            Email = toUpdatePerson.Object.Email,
                            Phone = toUpdatePerson.Object.Phone,
                            Cart = JsonConvert.SerializeObject(p),
                            Wishlist = toUpdatePerson.Object.Wishlist,

                        });

                    return true;
                }
                return false;

            }
            catch (Exception e)
            {
                await App.Current.MainPage.DisplayAlert("YourApp", $"Error:{e}", "Ok");

                return false;
            }


        }
        public async Task<bool> AddToWishlist(String email, Product product)
        {

            try
            {
                var toUpdatePerson = (await firebase
                .Child("Users")
                .OnceAsync<Users>()).Where(a => a.Object.Email == email).FirstOrDefault();

                ObservableCollection<Product> p;
                if (toUpdatePerson.Object != null)
                {

                    if (toUpdatePerson.Object.Wishlist != string.Empty)
                    {
                        p = JsonConvert.DeserializeObject<ObservableCollection<Product>>(toUpdatePerson.Object.Cart);
                        p.Add(product);

                    }
                    else
                    {
                        p = new ObservableCollection<Product>() { product };
                    }

                    await firebase
                      .Child("Users")
                      .Child(toUpdatePerson.Key)
                      .PutAsync(
                        new Users()
                        {
                            Firstname = toUpdatePerson.Object.Firstname,
                            Lastname = toUpdatePerson.Object.Lastname,
                            Email = toUpdatePerson.Object.Email,
                            Phone = toUpdatePerson.Object.Phone,
                            Cart = toUpdatePerson.Object.Cart,
                            Wishlist = JsonConvert.SerializeObject(p),

                        });

                    return true;
                }
                return false;
            }
            catch (Exception e)
            {
                Debug.WriteLine($"Error:{e}");
                return false;
            }
        }
        public async Task<bool> DeleteUser(String email)
        {
            try
            {
                var toDeletePerson = (await firebase
          .Child("Users")
          .OnceAsync<Users>()).Where(a => a.Object.Email == email).FirstOrDefault();
                await firebase.Child("Users").Child(toDeletePerson.Key).DeleteAsync();
                return true;
            }
            catch (Exception e)
            {
                Debug.WriteLine($"Error:{e}");
                return false;
            }


        }
        public async Task<bool> DeleteProduct(string email, Product product)
        {
            try
            {
                var toDeleteProduct = (await firebase
                .Child("Users")
                .OnceAsync<Users>()).Where(a => a.Object.Email == email).FirstOrDefault();

                List<Product> allproducts = JsonConvert.DeserializeObject<List<Product>>(toDeleteProduct.Object.Cart);

                Product itemToRemove = allproducts.SingleOrDefault(r => r.Id == product.Id);
                if (itemToRemove != null)
                    allproducts.Remove(itemToRemove);

                await firebase
                      .Child("Users")
                      .Child(toDeleteProduct.Key)
                      .PutAsync(
                        new Users()
                        {
                            Firstname = toDeleteProduct.Object.Firstname,
                            Lastname = toDeleteProduct.Object.Lastname,
                            Email = toDeleteProduct.Object.Email,
                            Phone = toDeleteProduct.Object.Phone,
                            Cart = JsonConvert.SerializeObject(allproducts),
                            Wishlist = toDeleteProduct.Object.Wishlist,

                        });
                return true;
            }
            catch (Exception e)
            {
                Debug.WriteLine($"Error:{e}");
                return false;
            }


        }

    }
}
